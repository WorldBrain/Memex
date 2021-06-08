import extractUrlParts from '@worldbrain/memex-url-utils/lib/extract-parts'
import {
    PersonalDataChange,
    PersonalContentLocator,
    PersonalContentMetadata,
    PersonalContentRead,
    PersonalTagConnection,
    PersonalTag,
} from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import {
    DataChangeType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { DOWNLOAD_CHANGE_BATCH_SIZE } from '../constants'
import {
    TranslationLayerDependencies,
    PersonalCloudUpdateBatch,
    PersonalCloudUpdateType,
} from '../../types'
import { FindManyOptions } from '@worldbrain/storex'

export async function downloadClientUpdatesV24(
    params: TranslationLayerDependencies & {
        startTime: number
    },
) {
    const { storageManager } = params
    const findOne = async (collection: string, where: any) => {
        return storageManager
            .collection(collection)
            .findObject({ ...where, user: params.userId }) as any
    }
    const findMany = async (
        collection: string,
        where: any,
        options?: FindManyOptions,
    ) => {
        return params.storageManager.collection(collection).findObjects(
            {
                ...where,
                user: params.userId,
            },
            options,
        )
    }

    const changes = (await findMany(
        'personalDataChange',
        {
            createdWhen: { $gt: params.startTime },
        },
        { limit: DOWNLOAD_CHANGE_BATCH_SIZE },
    )) as PersonalDataChange[]

    const batch: PersonalCloudUpdateBatch = []
    for (const change of changes) {
        if (
            change.type === DataChangeType.Create ||
            change.type === DataChangeType.Modify
        ) {
            if (change.collection === 'personalContentLocator') {
                continue
            }

            const object = await findOne(change.collection, {
                id: change.objectId,
            })
            if (!object) {
                continue
            }

            if (change.collection === 'personalContentMetadata') {
                const metadata = object as PersonalContentMetadata & {
                    id: string | number
                }
                const locatorArray = (await findMany(
                    'personalContentLocator',
                    {
                        personalContentMetadata: metadata.id,
                    },
                    { limit: 1 },
                )) as PersonalContentLocator[]
                if (!locatorArray.length) {
                    continue
                }
                batch.push({
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'pages',
                    object: getPageFromRemote(metadata, locatorArray[0]),
                })
            } else if (change.collection === 'personalContentRead') {
                const read = object as PersonalContentRead & {
                    personalContentMetadata: number | string
                }
                const locatorArray = (await findMany(
                    'personalContentLocator',
                    {
                        personalContentMetadata: read.personalContentMetadata,
                    },
                    { limit: 1 },
                )) as PersonalContentLocator[]
                batch.push({
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'visits',
                    object: {
                        url: locatorArray[0].location,
                        time: read.readWhen,
                        duration: read.readDuration,
                        scrollMaxPerc: 100,
                        scrollMaxPx: read.scrollTotal,
                        scrollPerc:
                            (read.scrollProgress / read.scrollTotal) * 100,
                        scrollPx: read.scrollProgress,
                    },
                })
            } else if (change.collection === 'personalTagConnection') {
                const tagConnection = object as PersonalTagConnection & {
                    personalTag: number | string
                }
                const [allContentLocators, tag] = await Promise.all<
                    PersonalContentLocator[],
                    PersonalTag
                >([
                    findOne('personalContentMetadata', {
                        id: object.objectId,
                    }).then((metadata) =>
                        findMany('personalContentLocator', {
                            personalContentMetadata: metadata.id,
                        }),
                    ) as Promise<PersonalContentLocator[]>,
                    findOne('personalTag', { id: tagConnection.personalTag }),
                ])
                const normalizedContentLocator = allContentLocators.find(
                    (locator) =>
                        locator.locationScheme ===
                        LocationSchemeType.NormalizedUrlV1,
                )
                batch.push({
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'tags',
                    object: {
                        url: normalizedContentLocator.location,
                        name: tag.name,
                    },
                })
            }
        } else if (change.type === DataChangeType.Delete) {
            if (change.collection === 'personalContentMetadata') {
                batch.push({
                    type: PersonalCloudUpdateType.Delete,
                    collection: 'pages',
                    where: { url: change.info?.normalizedUrl },
                })
            }
        }
    }

    return {
        batch,
        mayHaveMore: changes.length === DOWNLOAD_CHANGE_BATCH_SIZE,
    }
}

function getPageFromRemote(
    metadata: PersonalContentMetadata,
    locator: PersonalContentLocator,
) {
    const urlParts = extractUrlParts(locator.originalLocation, {
        supressParseError: false,
    })
    return {
        url: locator.location,
        fullUrl: locator.originalLocation,
        domain: urlParts.domain,
        hostname: urlParts.hostname,
        fullTitle: metadata.title,
        text: '',
        lang: metadata.lang,
        canonicalUrl: metadata.canonicalUrl,
        description: metadata.description,
    }
}

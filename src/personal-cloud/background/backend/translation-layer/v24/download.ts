import extractUrlParts from '@worldbrain/memex-url-utils/lib/extract-parts'
import {
    PersonalDataChange,
    PersonalContentLocator,
    PersonalContentMetadata,
} from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import { DataChangeType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
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
                user: params.userId,
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
                        user: params.userId,
                        id: metadata.id,
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

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

export async function downloadClientUpdatesV24(
    params: TranslationLayerDependencies & {
        startTime: number
    },
) {
    const { storageManager } = params

    const changes: PersonalDataChange[] = await params.storageManager
        .collection('personalDataChange')
        .findObjects(
            {
                createdWhen: { $gt: params.startTime },
            },
            { limit: DOWNLOAD_CHANGE_BATCH_SIZE },
        )

    const batch: PersonalCloudUpdateBatch = []
    for (const change of changes) {
        if (
            change.type === DataChangeType.Create ||
            change.type === DataChangeType.Modify
        ) {
            if (change.collection === 'personalContentMetadata') {
                continue
            }

            const object = await storageManager
                .collection(change.collection)
                .findObject({ id: change.objectId })
            if (!object) {
                continue
            }

            if (change.collection === 'personalContentLocator') {
                const locator = object as PersonalContentLocator & {
                    personalContentMetadata: number | string
                }
                const metadata: PersonalContentMetadata & {
                    id: string | number
                } = await storageManager
                    .collection('personalContentMetadata')
                    .findObject({
                        id: locator.personalContentMetadata,
                    })
                batch.push({
                    type: PersonalCloudUpdateType.Overwrite,
                    collection: 'pages',
                    object: getPageFromRemote(metadata, locator),
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

import {
    PersonalDataChange,
    PersonalContentLocator,
    PersonalContentMetadata,
} from '@worldbrain/memex-common/lib/web-interface/types/storex-generated/personal-cloud'
import {
    PersonalCloudUpdatePushBatch,
    TranslationLayerDependencies,
    PersonalCloudUpdateBatch,
    PersonalCloudUpdateType,
} from '../types'
import { uploadClientUpdate } from './v24/upload'
import { DOWNLOAD_CHANGE_BATCH_SIZE } from './constants'
import { DataChangeType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

export async function uploadClientUpdates(
    params: TranslationLayerDependencies & {
        updates: PersonalCloudUpdatePushBatch
    },
) {
    for (const update of params.updates) {
        await uploadClientUpdate({
            ...params,
            update,
        })
    }
}

export async function downloadClientUpdates(
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
    return {
        url: locator.location,
        fullUrl: locator.originalLocation,
        domain: '',
        hostname: '',
        fullTitle: '',
        text: '',
        lang: '',
        canonicalUrl: '',
        description: '',
    }
}

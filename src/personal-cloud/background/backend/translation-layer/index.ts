import {
    PersonalCloudUpdatePushBatch,
    TranslationLayerDependencies,
} from '../types'
import { uploadClientUpdateV24 } from './v24/upload'
import { downloadClientUpdatesV24 } from './v24/download'

export async function uploadClientUpdates(
    params: TranslationLayerDependencies & {
        updates: PersonalCloudUpdatePushBatch
    },
) {
    for (const update of params.updates) {
        await uploadClientUpdateV24({
            ...params,
            update,
        })
    }
}

export async function downloadClientUpdates(
    params: TranslationLayerDependencies & {
        clientSchemaVersion: Date
        startTime: number
    },
) {
    return downloadClientUpdatesV24(params)
}

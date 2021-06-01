import {
    PersonalCloudUpdatePushBatch,
    TranslationLayerDependencies,
} from '../types'
import { processClientUpdate } from './v24/upload'

export async function processClientUpdates(
    params: TranslationLayerDependencies & {
        updates: PersonalCloudUpdatePushBatch
    },
) {
    for (const update of params.updates) {
        await processClientUpdate({
            ...params,
            update,
        })
    }
}

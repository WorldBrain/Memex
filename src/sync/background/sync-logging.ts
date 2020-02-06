import {
    SyncLoggingMiddleware,
    SyncLoggingOperationPreprocessor,
} from '@worldbrain/storex-sync/lib/logging-middleware'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'

export const filterBlobsFromSyncLog: SyncLoggingOperationPreprocessor = async args => {
    let { operation } = args
    if (operation[0] === 'createObject') {
        const collection = operation[1]
        if (collection === 'pages') {
            operation = [...operation]
            const object = (operation[2] = { ...operation[2] })
            delete object.screenshot

            for (const field of Object.keys(object)) {
                if (isTermsField({ collection, field })) {
                    delete object[field]
                }
            }
        }
    } else if (operation[0] === 'updateObjects') {
        const collection = operation[1]
        if (collection === 'pages') {
            operation = [...operation]
            const updates = (operation[3] = { ...operation[3] })
            delete updates.screenshot

            for (const field of Object.keys(updates)) {
                if (isTermsField({ collection, field })) {
                    delete updates[field]
                }
            }

            if (!Object.keys(operation[3]).length) {
                return { operation: null }
            }
        }
    }
    return { operation }
}

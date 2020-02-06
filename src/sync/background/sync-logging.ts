import { SyncLoggingOperationPreprocessor } from '@worldbrain/storex-sync/lib/logging-middleware'
import { isTermsField } from '@worldbrain/memex-common/lib/storage/utils'

export const filterSyncLog: SyncLoggingOperationPreprocessor = async args => {
    const removeTermFields = (object: any, collection: string) => {
        for (const field of Object.keys(object)) {
            if (isTermsField({ collection, field })) {
                delete object[field]
            }
        }
    }

    let { operation } = args
    if (operation[0] === 'createObject') {
        const collection = operation[1]
        if (collection === 'pages') {
            operation = [...operation]
            const object = (operation[2] = { ...operation[2] })
            delete object.screenshot
            removeTermFields(object, collection)
        }
    } else if (
        operation[0] === 'updateObject' ||
        operation[0] === 'updateObjects'
    ) {
        const collection = operation[1]
        if (collection === 'pages') {
            operation = [...operation]
            const updates = (operation[3] = { ...operation[3] })
            delete updates.screenshot
            removeTermFields(updates, collection)

            if (!Object.keys(updates).length) {
                return { operation: null }
            }
        }
    }
    return { operation: args.operation, loggedOperation: operation }
}

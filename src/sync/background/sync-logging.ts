import {
    SyncLoggingMiddleware,
    SyncLoggingOperationPreprocessor,
} from '@worldbrain/storex-sync/lib/logging-middleware'

export const filterBlobsFromSyncLog: SyncLoggingOperationPreprocessor = async args => {
    let { operation } = args
    if (operation[0] === 'createObject') {
        if (operation[1] === 'pages') {
            operation = [...operation]
            operation[2] = { ...operation[2] }
            delete operation[2].screenshot
        }
    } else if (operation[0] === 'updateObjects') {
        if (operation[1] === 'pages') {
            operation = [...operation]
            operation[3] = { ...operation[3] }
            delete operation[3].screenshot

            if (!Object.keys(operation[3]).length) {
                return { operation: null }
            }
        }
    }
    return { operation }
}

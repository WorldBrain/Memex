import StorageManager from '@worldbrain/storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'
import SyncService from '@worldbrain/memex-common/lib/sync'
import { StorexHubBackground } from 'src/storex-hub/background'

export async function setStorageMiddleware(
    storageManager: StorageManager,
    options: {
        syncService: SyncService
        storexHub?: StorexHubBackground
        modifyMiddleware?: (
            middleware: StorageMiddleware[],
        ) => StorageMiddleware[]
    },
) {
    const modifyMiddleware =
        options.modifyMiddleware ?? ((middleware) => middleware)

    const syncedCollections = new Set(SYNCED_COLLECTIONS)
    storageManager.setMiddleware(
        modifyMiddleware([
            // {
            //     process: async (context) => {
            //         const result = await context.next.process({
            //             operation: context.operation,
            //         })
            //         console.groupCollapsed('operation', context.operation[0])
            //         console.log({
            //             operation: context.operation,
            //             result,
            //         })
            //         console.trace()
            //         console.groupEnd()
            //         return result
            //     },
            // },
            new ChangeWatchMiddleware({
                storageManager,
                shouldWatchCollection: (collection) =>
                    syncedCollections.has(collection),
                postprocessOperation: async (event) => {
                    await options.storexHub.handlePostStorageChange(event)
                },
            }),
            await options.syncService.createSyncLoggingMiddleware(),
        ]),
    )
}

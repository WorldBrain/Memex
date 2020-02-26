import StorageManager from '@worldbrain/storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher'
import { BackgroundModules } from 'src/background-script/setup'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'

export async function setStorageMiddleware(
    storageManager: StorageManager,
    options: {
        backgroundModules: BackgroundModules
        modifyMiddleware?: (
            middleware: StorageMiddleware[],
        ) => StorageMiddleware[]
    },
) {
    const modifyMiddleware =
        options.modifyMiddleware ?? (middleware => middleware)

    const syncedCollections = new Set(SYNCED_COLLECTIONS)
    storageManager.setMiddleware(
        modifyMiddleware([
            new ChangeWatchMiddleware({
                storageManager,
                shouldWatchCollection: collection =>
                    syncedCollections.has(collection),
                postprocessOperation: async event => {
                    await options.backgroundModules.storexHub.handlePostStorageChange(
                        event,
                    )
                },
            }),
            await options.backgroundModules.sync.createSyncLoggingMiddleware(),
        ]),
    )
}

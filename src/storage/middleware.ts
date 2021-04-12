import StorageManager from '@worldbrain/storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'
import SyncService from '@worldbrain/memex-common/lib/sync'
import { StorexHubBackground } from 'src/storex-hub/background'
import ContentSharingBackground from 'src/content-sharing/background'
import { ReadwiseBackground } from 'src/readwise-integration/background'

export async function setStorageMiddleware(
    storageManager: StorageManager,
    options: {
        syncService: SyncService
        storexHub?: StorexHubBackground
        contentSharing?: ContentSharingBackground
        readwise?: ReadwiseBackground
        modifyMiddleware?: (
            middleware: StorageMiddleware[],
        ) => StorageMiddleware[]
    },
) {
    const modifyMiddleware =
        options.modifyMiddleware ?? ((middleware) => middleware)

    const syncedCollections = new Set(SYNCED_COLLECTIONS)
    const changeWatchMiddleware = new ChangeWatchMiddleware({
        storageManager,
        shouldWatchCollection: (collection) =>
            syncedCollections.has(collection),
        postprocessOperation: async (event) => {
            await Promise.all([
                options.storexHub?.handlePostStorageChange(event),
                options.contentSharing?.handlePostStorageChange(event, {
                    source: 'local',
                }),
                options.readwise?.handlePostStorageChange(event, {
                    source: 'local',
                }),
            ])
        },
    })

    let shouldLogStorageOperations = false
    const setStorageLoggingEnabled = (value: boolean) =>
        (shouldLogStorageOperations = value)

    storageManager.setMiddleware(
        modifyMiddleware([
            createOperationLoggingMiddleware({
                shouldLog: () => shouldLogStorageOperations,
            }),
            changeWatchMiddleware,
            await options.syncService.createSyncLoggingMiddleware(),
        ]),
    )

    const syncChangeWatchMiddleware = new ChangeWatchMiddleware({
        storageManager,
        shouldWatchCollection: (collection) =>
            syncedCollections.has(collection),
        postprocessOperation: async (event) => {
            await Promise.all([
                options.storexHub?.handlePostStorageChange(event),
                options.contentSharing?.handlePostStorageChange(event, {
                    source: 'sync',
                }),
                options.readwise?.handlePostStorageChange(event, {
                    source: 'sync',
                }),
            ])
        },
    })
    options.syncService.executeReconciliationOperation = async (
        operationName: string,
        ...operationArgs: any[]
    ) => {
        return syncChangeWatchMiddleware.process({
            operation: [operationName, ...operationArgs],
            extraData: {},
            next: {
                process: (context) => {
                    return storageManager.backend.operation(
                        context.operation[0],
                        ...context.operation.slice(1),
                    )
                },
            },
        })
    }

    return {
        setStorageLoggingEnabled,
    }
}

export function createOperationLoggingMiddleware(options: {
    shouldLog: () => boolean
}): StorageMiddleware {
    return {
        process: async (context) => {
            const next = () =>
                context.next.process({
                    operation: context.operation,
                })
            if (!options.shouldLog()) {
                return next()
            }
            const info: string[] = [context.operation[0]]
            if (typeof context.operation[1] === 'string') {
                info.push(context.operation[1])
            }
            console.groupCollapsed('operation', ...info)
            console.time('operation execution time')

            try {
                const result = await next()

                console.timeEnd('operation execution time')
                console['log']({
                    operation: context.operation,
                    result,
                })
                console['trace']()
                console.groupEnd()
                return result
            } catch (e) {
                console.timeEnd('operation execution time')
                console['log']({
                    operation: context.operation,
                    result: 'error',
                })
                console.groupEnd()
                throw e
            }
        },
    }
}

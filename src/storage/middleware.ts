import StorageManager from '@worldbrain/storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher'
import { SYNCED_COLLECTIONS } from '@worldbrain/memex-common/lib/sync/constants'
import SyncService from '@worldbrain/memex-common/lib/sync'
import { StorexHubBackground } from 'src/storex-hub/background'
import ContentSharingBackground from 'src/content-sharing/background'
import { ReadwiseBackground } from 'src/readwise-integration/background'
import { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import { PersonalCloudBackground } from 'src/personal-cloud/background'
import { CLOUD_SYNCED_COLLECTIONS } from 'src/personal-cloud/background/constants'

export async function setStorageMiddleware(
    storageManager: StorageManager,
    options: {
        syncService: SyncService
        storexHub?: StorexHubBackground
        contentSharing?: ContentSharingBackground
        readwise?: ReadwiseBackground
        personalCloud?: PersonalCloudBackground
        modifyMiddleware?: (
            middleware: StorageMiddleware[],
        ) => StorageMiddleware[]
    },
) {
    const modifyMiddleware =
        options.modifyMiddleware ?? ((middleware) => middleware)

    const syncedCollections = new Set(
        SYNCED_COLLECTIONS.concat(CLOUD_SYNCED_COLLECTIONS),
    )

    const postProcessChange = async (
        event: StorageOperationEvent<'post'>,
        source: 'local' | 'sync',
    ) => {
        const promises = [
            options.storexHub?.handlePostStorageChange(event),
            options.contentSharing?.handlePostStorageChange(event, {
                source,
            }),
            options.readwise?.handlePostStorageChange(event, {
                source,
            }),
        ]
        if (source !== 'sync') {
            promises.push(options.personalCloud?.handlePostStorageChange(event))
        }
        await Promise.all(promises)
    }

    const changeWatchMiddleware = new ChangeWatchMiddleware({
        storageManager,
        shouldWatchCollection: (collection) =>
            syncedCollections.has(collection),
        postprocessOperation: async (event) => {
            await postProcessChange(event, 'local')
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

    // const syncChangeWatchMiddleware = new ChangeWatchMiddleware({
    //     storageManager,
    //     shouldWatchCollection: (collection) =>
    //         syncedCollections.has(collection),
    //     postprocessOperation: async (event) => {
    //         await postProcessChange(event, 'sync')
    //     },
    // })
    // options.syncService.executeReconciliationOperation = async (
    //     operationName: string,
    //     ...operationArgs: any[]
    // ) => {
    //     return syncChangeWatchMiddleware.process({
    //         operation: [operationName, ...operationArgs],
    //         extraData: {},
    //         next: {
    //             process: (context) => {
    //                 return storageManager.backend.operation(
    //                     context.operation[0],
    //                     ...context.operation.slice(1),
    //                 )
    //             },
    //         },
    //     })
    // }

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
            console.log('executing operation', ...info)

            try {
                const result = await next()

                console['log']('done operation', {
                    operation: context.operation,
                    result,
                })
                return result
            } catch (e) {
                console['log']('failed operation', {
                    operation: context.operation,
                    result: 'error',
                })
                throw e
            }
        },
    }
}

import type StorageManager from '@worldbrain/storex'
import type { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import type { StorexHubBackground } from 'src/storex-hub/background'
import type ContentSharingBackground from 'src/content-sharing/background'
import type { StorageOperationEvent } from '@worldbrain/storex-middleware-change-watcher/lib/types'
import type { PersonalCloudBackground } from 'src/personal-cloud/background'
import type CustomListBackground from 'src/custom-lists/background'
import { WATCHED_COLLECTIONS } from './constants'
import { ChangeWatchMiddleware } from '@worldbrain/storex-middleware-change-watcher'
import {
    ListTreeMiddleware,
    initListTreeOperationWatchers,
} from '@worldbrain/memex-common/lib/content-sharing/storage/list-tree-middleware'

export function setStorageMiddleware(
    storageManager: StorageManager,
    options: {
        contentSharing: ContentSharingBackground
        personalCloud: PersonalCloudBackground
        customLists: CustomListBackground
        storexHub: StorexHubBackground
        modifyMiddleware?: (
            middleware: StorageMiddleware[],
        ) => StorageMiddleware[]
    },
) {
    const modifyMiddleware =
        options.modifyMiddleware ?? ((middleware) => middleware)
    const watchedCollections = new Set(WATCHED_COLLECTIONS)

    const postProcessChange = async (
        event: StorageOperationEvent<'post'>,
        source: 'local' | 'sync',
    ) => {
        const promises = [
            options.storexHub?.handlePostStorageChange(event),
            options.contentSharing?.handlePostStorageChange(event, {
                source,
            }),
        ]
        if (source !== 'sync') {
            promises.push(options.personalCloud?.handlePostStorageChange(event))
        }
        await Promise.all(promises)
    }

    const listTreeMiddleware = new ListTreeMiddleware({
        moveTree: (args) =>
            options.customLists.storage.updateListTreeParent(args),
        deleteTree: (args) =>
            options.contentSharing.performDeleteListAndAllAssociatedData(args),
    })

    const changeWatchMiddleware = new ChangeWatchMiddleware({
        storageManager,
        customOperationWatchers: initListTreeOperationWatchers({
            handleListTreeStorageChange: (update) =>
                options.personalCloud?.handleListTreeStorageChange(update),
        }),
        shouldWatchCollection: (collection) =>
            watchedCollections.has(collection),
        postprocessOperation: async (event) => {
            await postProcessChange(event, 'local')
        },
    })

    let shouldLogStorageOperations =
        process.env.LOG_STORAGE_OPERATIONS === 'true'
    const setStorageLoggingEnabled = (value: boolean) =>
        (shouldLogStorageOperations = value)

    storageManager.setMiddleware(
        modifyMiddleware([
            createOperationLoggingMiddleware({
                shouldLog: () => shouldLogStorageOperations,
            }),
            changeWatchMiddleware,
            listTreeMiddleware,
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

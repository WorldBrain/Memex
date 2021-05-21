import { getFirebase } from 'src/util/firebase-app-initialized'
import 'firebase/database'
import 'firebase/firestore'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import {
    registerModuleMapCollections,
    _defaultOperationExecutor,
    StorageOperationExecuter,
} from '@worldbrain/storex-pattern-modules'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { ALLOWED_STORAGE_MODULE_OPERATIONS } from '@worldbrain/memex-common/lib/firebase-backend/app-layer/allowed-operations'
import { createClientApplicationLayer } from '@worldbrain/memex-common/lib/firebase-backend/app-layer/client'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { createOperationLoggingMiddleware } from 'src/storage/middleware'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import { ServerStorage } from './types'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'
import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import ActivityFollowsStorage from '@worldbrain/memex-common/lib/activity-follows/storage'

let shouldLogOperations = false

export function createServerStorageManager() {
    const firebase = getFirebase()
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        firebase.firestore().settings({
            host: 'localhost:8080',
            ssl: false,
        })
    }
    const storageManager = new StorageManager({ backend: serverStorageBackend })
    storageManager.setMiddleware([
        createOperationLoggingMiddleware({
            shouldLog: () => shouldLogOperations,
        }),
    ])
    return storageManager
}

export function createLazyServerStorage(
    createStorageManager: () => StorageManager,
    options: {
        autoPkType: 'string' | 'number'
        sharedSyncLog?: SharedSyncLogStorage
        skipApplicationLayer?: boolean
    },
) {
    let serverStoragePromise: Promise<ServerStorage>
    const storageManager = createStorageManager()

    try {
        window['setServerStorageLoggingEnabled'] = (value: boolean) =>
            (shouldLogOperations = value)
    } catch (e) {}

    return async () => {
        if (serverStoragePromise) {
            return serverStoragePromise
        }

        serverStoragePromise = (async () => {
            const operationExecuter = !options.skipApplicationLayer
                ? getFirebaseOperationExecuter(storageManager)
                : (stroageModuleName: string) =>
                      _defaultOperationExecutor(storageManager)

            const sharedSyncLog =
                options.sharedSyncLog ??
                new SharedSyncLogStorage({
                    storageManager,
                    autoPkType: 'string',
                })
            const contentSharing = new ContentSharingStorage({
                storageManager,
                operationExecuter: operationExecuter('contentSharing'),
                ...options,
            })
            const contentConversations = new ContentConversationStorage({
                storageManager,
                contentSharing,
                operationExecuter: operationExecuter('contentConversations'),
                ...options,
            })
            const userManagement = new UserStorage({
                storageManager,
                operationExecuter: operationExecuter('users'),
            })
            const activityStreams = new ActivityStreamsStorage({
                storageManager,
            })
            const activityFollows = new ActivityFollowsStorage({
                storageManager,
                operationExecuter: operationExecuter('activityFollows'),
            })
            const serverStorage: ServerStorage = {
                storageManager,
                storageModules: {
                    sharedSyncLog,
                    userManagement,
                    contentSharing,
                    activityStreams,
                    activityFollows,
                    contentConversations,
                },
            }
            registerModuleMapCollections(
                storageManager.registry,
                serverStorage.storageModules,
            )
            await storageManager.finishInitialization()

            return serverStorage
        })()

        return serverStoragePromise
    }
}

export function createLazyMemoryServerStorage() {
    return createLazyServerStorage(
        () => {
            const backend = new DexieStorageBackend({
                dbName: 'server',
                idbImplementation: inMemory(),
            })
            return new StorageManager({ backend })
        },
        {
            autoPkType: 'number',
            skipApplicationLayer: true,
        },
    )
}

function getFirebaseOperationExecuter(storageManager: StorageManager) {
    const firebase = getFirebase()

    const applicationLayer = createClientApplicationLayer(
        async (name, params) => {
            const functions = firebase.functions()
            const result = await functions.httpsCallable(name)(params)
            return result.data
        },
    )

    const defaultOperationExecutor = _defaultOperationExecutor(storageManager)
    const operationExecuter: (
        storageModuleName: keyof typeof ALLOWED_STORAGE_MODULE_OPERATIONS,
    ) => StorageOperationExecuter = (storageModuleName) => async (params) => {
        const allowModuleOperations = ALLOWED_STORAGE_MODULE_OPERATIONS[
            storageModuleName
        ] as any
        if (!allowModuleOperations?.[params.name]) {
            return defaultOperationExecutor(params)
        }
        return applicationLayer.executeStorageModuleOperation({
            storageModule: storageModuleName,
            operationName: params.name,
            operationArgs: params.context,
        })
    }

    return operationExecuter
}

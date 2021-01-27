import { getFirebase } from 'src/util/firebase-app-initialized'
import 'firebase/database'
import 'firebase/firestore'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { createOperationLoggingMiddleware } from 'src/storage/middleware'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import { ServerStorage } from './types'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'

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
    },
) {
    let serverStoragePromise: Promise<ServerStorage>

    try {
        window['setServerStorageLoggingEnabled'] = (value: boolean) =>
            (shouldLogOperations = value)
    } catch (e) {}

    return async () => {
        if (serverStoragePromise) {
            return serverStoragePromise
        }

        serverStoragePromise = (async () => {
            const storageManager = createStorageManager()
            const sharedSyncLog =
                options.sharedSyncLog ??
                new SharedSyncLogStorage({
                    storageManager,
                    autoPkType: 'string',
                })
            const contentSharing = new ContentSharingStorage({
                storageManager,
                ...options,
            })
            const contentConversations = new ContentConversationStorage({
                storageManager,
                contentSharing,
                ...options,
            })
            const userManagement = new UserStorage({
                storageManager,
            })
            const serverStorage: ServerStorage = {
                storageManager,
                storageModules: {
                    sharedSyncLog,
                    userManagement,
                    contentSharing,
                    contentConversations,
                },
            }
            registerModuleMapCollections(storageManager.registry, {
                sharedSyncLog,
                contentSharing,
                userManagement,
            })
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
        },
    )
}

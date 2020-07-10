import { getFirebase } from 'src/util/firebase-app-initialized'
import 'firebase/database'
import 'firebase/firestore'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import ContentSharingStorage from 'src/content-sharing/background/storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import { ServerStorage } from './types'

export function createServerStorageManager() {
    const firebase = getFirebase()
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return new StorageManager({ backend: serverStorageBackend })
}

export function createLazyServerStorage(
    createStorageManager: () => StorageManager,
) {
    let serverStorage: ServerStorage

    return async () => {
        if (serverStorage) {
            return serverStorage
        }

        const storageManager = createStorageManager()
        const sharedSyncLog = new SharedSyncLogStorage({
            storageManager,
            autoPkType: 'string',
        })
        const contentSharing = new ContentSharingStorage({
            storageManager,
        })
        serverStorage = {
            storageManager,
            storageModules: {
                sharedSyncLog,
                contentSharing,
            },
        }
        registerModuleMapCollections(storageManager.registry, {
            sharedSyncLog,
            contentSharing,
        })
        await storageManager.finishInitialization()

        return serverStorage
    }
}

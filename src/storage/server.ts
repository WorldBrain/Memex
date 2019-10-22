import 'firebase/firestore'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { firebase } from 'src/util/firebase-app-initialized'

export function createServerStorageManager() {
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return new StorageManager({ backend: serverStorageBackend })
}

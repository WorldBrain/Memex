import { getFirebase } from 'src/util/firebase-app-initialized'
import 'firebase/database'
import 'firebase/firestore'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'

export function createServerStorageManager() {
    const firebase = getFirebase()
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return new StorageManager({ backend: serverStorageBackend })
}

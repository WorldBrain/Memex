import firebase from 'firebase'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'

export function createServerStorageManager(firebaseConfig: Object) {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig)
    }
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return new StorageManager({ backend: serverStorageBackend })
}

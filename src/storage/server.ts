import firebase from 'firebase'
import StorageManager from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'

export function createServerStorageManager() {
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: 'AIzaSyDZhd-4XonvNk5jpg2a5F2_XmKb3G2jI9U',
            authDomain: 'worldbrain-1057.firebaseapp.com',
            databaseURL: 'https://worldbrain-1057.firebaseio.com',
            projectId: 'worldbrain-1057',
            storageBucket: 'worldbrain-1057.appspot.com',
            messagingSenderId: '455172385517',
            appId: '1:455172385517:web:ad25d7f0325f2ddc0c3ae4',
        })
    }
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return new StorageManager({ backend: serverStorageBackend })
}

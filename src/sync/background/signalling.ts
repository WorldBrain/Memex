import firebase from 'firebase'
import { SignalTransport } from 'simple-signalling/lib/types'
import { FirebaseSignalTransport } from 'simple-signalling/lib/firebase'
import { initializeFirebaseIfNeeded } from 'src/storage/server'

export function createFirebaseSignalTransport(): SignalTransport {
    initializeFirebaseIfNeeded()

    return new FirebaseSignalTransport({
        database: firebase.database() as any,
        collectionName: 'signalling',
    })
}

import { SignalTransport } from 'simple-signalling/ts/types'
import { FirebaseSignalTransport } from 'simple-signalling/ts/firebase'
import { getFirebase } from 'src/util/firebase-app-initialized'

export function createFirebaseSignalTransport(): SignalTransport {
    return new FirebaseSignalTransport({
        database: getFirebase().database() as any,
        collectionName: 'signalling',
    })
}

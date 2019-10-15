import { SignalTransport } from 'simple-signalling/lib/types'
import { FirebaseSignalTransport } from 'simple-signalling/lib/firebase'
import { getFirebase } from 'src/storage/server'

export function createFirebaseSignalTransport(): SignalTransport {
    return new FirebaseSignalTransport({
        database: getFirebase().database() as any,
        collectionName: 'signalling',
    })
}

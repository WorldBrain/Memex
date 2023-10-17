import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'

export async function createFirestoreEmulatorStorageBackend(options: {
    firebaseProjectId?: string
    withTestUser?: { uid: string } | boolean
    firestoreEmulatorConf?: { host: string; port: number }
    // superuser?: boolean
}): Promise<FirestoreStorageBackend> {
    const fs = require('node:fs/promises')
    const userId = options.withTestUser
        ? options.withTestUser === true
            ? 'default-user'
            : options.withTestUser.uid
        : undefined
    const firebaseProjectId = options.firebaseProjectId ?? Date.now().toString()

    const rules = process.env.DISABLE_FIRESTORE_RULES
        ? `
service cloud.firestore {
    match /databases/{database}/documents {
        match /{document=**} {
            allow read, write; // or allow read, write: if true;
        }
    }
}
`
        : // TODO: This currently assumes the firebase-backend repo is a sibling of the Memex dir and is up-to-date. Make it more robust
          await fs.readFile(
              '../firebase-backend/firebase/firestore.rules',
              'utf8',
          )

    const testEnv = await initializeTestEnvironment({
        projectId: firebaseProjectId,
        firestore: options.firestoreEmulatorConf ?? {
            host: '127.0.0.1',
            port: 8080,
            rules,
        },
    })
    const context =
        userId != null
            ? testEnv.authenticatedContext(userId)
            : testEnv.unauthenticatedContext()

    return new FirestoreStorageBackend({
        firebase: { firestore: context.firestore } as any,
        firestore: context.firestore() as any,
    })
}

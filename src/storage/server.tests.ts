import type StorageManager from '@worldbrain/storex'
import type { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { documentId, Timestamp, serverTimestamp } from '@firebase/firestore'
import type { ServerStorage } from './types'
import { createStorageManager, createServerStorage } from './server'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'

async function createFirestoreEmulatorStorageBackend(options: {
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
        firebaseModules: {
            documentId,
            serverTimestamp,
            fromMillis: Timestamp.fromMillis,
        },
        firestore: context.firestore() as any,
    })
}

export async function createTestServerStorage(options: {
    firebaseProjectId?: string
    withTestUser?: { uid: string } | boolean
    // superuser?: boolean
    setupMiddleware?: (storageMan: StorageManager) => StorageMiddleware[]
}): Promise<ServerStorage> {
    if (process.env.TEST_SERVER_STORAGE === 'firebase-emulator') {
        const backend = await createFirestoreEmulatorStorageBackend(options)
        const storageManager = createStorageManager(backend, options)

        return createServerStorage(storageManager, {
            autoPkType: 'string',
            skipApplicationLayer: true,
        })
    } else {
        return createMemoryServerStorage(options)
    }
}

export function createMemoryServerStorage(options?: {
    setupMiddleware?(manager: StorageManager): StorageMiddleware[]
}): Promise<ServerStorage> {
    const backend = new DexieStorageBackend({
        dbName: 'server',
        idbImplementation: inMemory(),
        legacyMemexCompatibility: true,
    })
    const storageManager = createStorageManager(backend, options)

    return createServerStorage(storageManager, {
        autoPkType: 'number',
        skipApplicationLayer: true,
    })
}

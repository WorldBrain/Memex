import { getFirebase } from 'src/util/firebase-app-initialized'
import 'firebase/compat/database'
import 'firebase/compat/firestore'
import StorageManager, { StorageBackend } from '@worldbrain/storex'
import { FirestoreStorageBackend } from '@worldbrain/storex-backend-firestore'
import {
    registerModuleMapCollections,
    _defaultOperationExecutor,
    StorageOperationExecuter,
} from '@worldbrain/storex-pattern-modules'
import { SharedSyncLogStorage } from '@worldbrain/storex-sync/lib/shared-sync-log/storex'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { ALLOWED_STORAGE_MODULE_OPERATIONS } from '@worldbrain/memex-common/lib/firebase-backend/app-layer/allowed-operations'
import { createClientApplicationLayer } from '@worldbrain/memex-common/lib/firebase-backend/app-layer/client'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { createOperationLoggingMiddleware } from 'src/storage/middleware'
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import { ServerStorage } from './types'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'
import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import ActivityFollowsStorage from '@worldbrain/memex-common/lib/activity-follows/storage'
import PersonalCloudStorage from '@worldbrain/memex-common/lib/personal-cloud/storage'
import { DiscordRetroSyncStorage } from '@worldbrain/memex-common/lib/discord/queue'
import DiscordStorage from '@worldbrain/memex-common/lib/discord/storage'
import {
    ChangeWatchMiddleware,
    ChangeWatchMiddlewareSettings,
} from '@worldbrain/storex-middleware-change-watcher'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import SlackStorage from '@worldbrain/memex-common/lib/slack/storage'
import { SlackRetroSyncStorage } from '@worldbrain/memex-common/lib/slack/storage/retro-sync'

let shouldLogOperations = false

export function createServerStorageManager(options?: {
    changeWatchSettings?: Omit<ChangeWatchMiddlewareSettings, 'storageManager'>
}) {
    const firebase = getFirebase()
    const serverStorageBackend = new FirestoreStorageBackend({
        firebase: firebase as any,
        firestore: firebase.firestore() as any,
    })
    return createStorageManager(serverStorageBackend, options)
}

export async function createServerStorage(
    storageManager: StorageManager,
    options: {
        autoPkType: 'string' | 'number'
        sharedSyncLog?: SharedSyncLogStorage
        skipApplicationLayer?: boolean
        changeWatchSettings?: Omit<
            ChangeWatchMiddlewareSettings,
            'storageManager'
        >
    },
): Promise<ServerStorage> {
    try {
        globalThis['setServerStorageLoggingEnabled'] = (value: boolean) =>
            (shouldLogOperations = value)
    } catch (e) {}

    const operationExecuter = !options.skipApplicationLayer
        ? getFirebaseOperationExecuter(storageManager)
        : (stroageModuleName: string) =>
              _defaultOperationExecutor(storageManager)

    const sharedSyncLog =
        options.sharedSyncLog ??
        new SharedSyncLogStorage({
            storageManager,
            autoPkType: 'string',
        })
    const contentSharing = new ContentSharingStorage({
        storageManager,
        operationExecuter: operationExecuter('contentSharing'),
        ...options,
    })
    const contentConversations = new ContentConversationStorage({
        storageManager,
        contentSharing,
        operationExecuter: operationExecuter('contentConversations'),
        ...options,
    })
    const users = new UserStorage({
        storageManager,
        operationExecuter: operationExecuter('users'),
    })
    const activityStreams = new ActivityStreamsStorage({
        storageManager,
    })
    const personalCloud = new PersonalCloudStorage({
        storageManager,
        autoPkType: options.autoPkType,
    })
    const activityFollows = new ActivityFollowsStorage({
        storageManager,
        operationExecuter: operationExecuter('activityFollows'),
    })
    const discord = new DiscordStorage({
        storageManager,
        operationExecuter: operationExecuter('discord'),
    })
    const discordRetroSync = new DiscordRetroSyncStorage({
        storageManager,
        operationExecuter: operationExecuter('discordRetroSync'),
    })
    const slack = new SlackStorage({
        storageManager,
        operationExecuter: operationExecuter('slack'),
    })
    const slackRetroSync = new SlackRetroSyncStorage({
        storageManager,
        operationExecuter: operationExecuter('slackRetroSync'),
    })
    const serverStorage: ServerStorage = {
        manager: storageManager,
        modules: {
            sharedSyncLog,
            users,
            contentSharing,
            activityStreams,
            activityFollows,
            contentConversations,
            personalCloud,
            discordRetroSync,
            discord,
            slackRetroSync,
            slack,
        },
    }
    registerModuleMapCollections(storageManager.registry, serverStorage.modules)
    await storageManager.finishInitialization()

    return serverStorage
}

export function createMemoryServerStorage(options?: {
    changeWatchSettings?: Omit<ChangeWatchMiddlewareSettings, 'storageManager'>
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

export async function createTestServerStorage(options?: {
    firebaseProjectId?: string
    withTestUser?: { uid: string } | boolean
    superuser?: boolean
    changeWatchSettings?: Omit<ChangeWatchMiddlewareSettings, 'storageManager'>
}): Promise<ServerStorage> {
    if (process.env.TEST_SERVER_STORAGE === 'firebase-emulator') {
        const firebaseTesting = require('@firebase/testing')
        const userId = options?.withTestUser
            ? options?.withTestUser === true
                ? 'default-user'
                : options?.withTestUser.uid
            : undefined
        const firebaseProjectId =
            options?.firebaseProjectId ?? Date.now().toString()
        const firebaseApp = options?.superuser
            ? firebaseTesting.initializeAdminApp({
                  projectId: firebaseProjectId,
              })
            : firebaseTesting.initializeTestApp({
                  projectId: firebaseProjectId,
                  auth: userId ? { uid: userId } : undefined,
              })
        if (process.env.DISABLE_FIRESTORE_RULES === 'true') {
            await firebaseTesting.loadFirestoreRules({
                projectId: firebaseProjectId,
                rules: `
            service cloud.firestore {
                match /databases/{database}/documents {
                    match /{document=**} {
                        allow read, write; // or allow read, write: if true;
                    }
                }
            }
            `,
            })
        }

        const firestore = firebaseApp.firestore()
        const backend = new FirestoreStorageBackend({
            firebase: firebaseApp as any,
            firebaseModule: firebaseTesting as any,
            firestore: firestore as any,
        })
        const storageManager = createStorageManager(backend, options)

        return createServerStorage(storageManager, {
            autoPkType: 'string',
            skipApplicationLayer: true,
        })
    } else {
        return createMemoryServerStorage(options)
    }
}

function createStorageManager(
    backend: StorageBackend,
    options?: {
        changeWatchSettings?: Omit<
            ChangeWatchMiddlewareSettings,
            'storageManager'
        >
    },
) {
    const storageManager = new StorageManager({ backend })
    setupServerStorageManagerMiddleware(storageManager, options)
    return storageManager
}

export function setupServerStorageManagerMiddleware(
    storageManager: StorageManager,
    options?: {
        changeWatchSettings?: Omit<
            ChangeWatchMiddlewareSettings,
            'storageManager'
        >
    },
) {
    const middleware: StorageMiddleware[] = [
        createOperationLoggingMiddleware({
            shouldLog: () => shouldLogOperations,
        }),
    ]
    if (options?.changeWatchSettings) {
        middleware.push(
            new ChangeWatchMiddleware({
                ...options.changeWatchSettings,
                storageManager,
            }),
        )
    }
    storageManager.setMiddleware(middleware)
}

function getFirebaseOperationExecuter(storageManager: StorageManager) {
    const firebase = getFirebase()

    const applicationLayer = createClientApplicationLayer(
        async (name, params) => {
            const functions = firebase.functions()
            const result = await functions.httpsCallable(name)(params)
            return result.data
        },
    )

    const defaultOperationExecutor = _defaultOperationExecutor(storageManager)
    const operationExecuter: (
        storageModuleName: keyof typeof ALLOWED_STORAGE_MODULE_OPERATIONS,
    ) => StorageOperationExecuter = (storageModuleName) => async (params) => {
        const allowModuleOperations = ALLOWED_STORAGE_MODULE_OPERATIONS[
            storageModuleName
        ] as any
        if (!allowModuleOperations?.[params.name]) {
            return defaultOperationExecutor(params)
        }
        return applicationLayer.executeStorageModuleOperation({
            storageModule: storageModuleName,
            operationName: params.name,
            operationArgs: params.context,
        })
    }

    return operationExecuter
}

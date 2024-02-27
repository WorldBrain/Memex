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
import { ContentSharingStorage } from 'src/content-sharing/background/storage'
import type { ServerStorage } from './types'
import ContentConversationStorage from '@worldbrain/memex-common/lib/content-conversations/storage'
import ActivityStreamsStorage from '@worldbrain/memex-common/lib/activity-streams/storage'
import ActivityFollowsStorage from '@worldbrain/memex-common/lib/activity-follows/storage'
import PersonalCloudStorage from '@worldbrain/memex-common/lib/personal-cloud/storage'
import { DiscordRetroSyncStorage } from '@worldbrain/memex-common/lib/discord/queue'
import DiscordStorage from '@worldbrain/memex-common/lib/discord/storage'
import type { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import SlackStorage from '@worldbrain/memex-common/lib/slack/storage'
import { SlackRetroSyncStorage } from '@worldbrain/memex-common/lib/slack/storage/retro-sync'
import { PublicApiStorage } from '@worldbrain/memex-common/lib/public-api/storage'
import { UploadsStorage } from '@worldbrain/memex-common/lib/uploads/storage'

let shouldLogOperations = false

export function createServerStorageManager(options?: {
    setupMiddleware?(manager: StorageManager): StorageMiddleware[]
}) {
    const firebase = getFirebase()
    const serverStorageBackend = new FirestoreStorageBackend({
        firestore: firebase.firestore() as any,
        firebaseModules: {
            serverTimestamp: firebase.firestore.FieldValue.serverTimestamp,
            documentId: firebase.firestore.FieldPath.documentId,
            fromMillis: firebase.firestore.Timestamp.fromMillis,
        },
    })
    return createStorageManager(serverStorageBackend, options)
}

export async function createServerStorage(
    storageManager: StorageManager,
    options: {
        autoPkType: 'string' | 'number'
        sharedSyncLog?: SharedSyncLogStorage
        skipApplicationLayer?: boolean
        middleware?: StorageMiddleware[]
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
    const publicApi = new PublicApiStorage({
        storageManager,
        operationExecuter: operationExecuter('publicApi'),
    })
    const uploads = new UploadsStorage({
        storageManager,
        operationExecuter: operationExecuter('uploads'),
    })
    const serverStorage: ServerStorage = {
        manager: storageManager,
        modules: {
            uploads,
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
            publicApi,
        },
    }
    registerModuleMapCollections(storageManager.registry, serverStorage.modules)
    await storageManager.finishInitialization()

    return serverStorage
}

export function createStorageManager(
    backend: StorageBackend,
    options?: {
        setupMiddleware?(manager: StorageManager): StorageMiddleware[]
    },
) {
    const storageManager = new StorageManager({ backend })
    const middleware = options?.setupMiddleware?.(storageManager) ?? []
    if (middleware.length) {
        storageManager.setMiddleware(middleware)
    }
    return storageManager
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

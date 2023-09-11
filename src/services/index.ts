import { httpsCallable, getFunctions } from 'firebase/functions'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import type { ServerStorage } from 'src/storage/types'
import type { Services } from './types'
import ListKeysService from './content-sharing'
import ContentConversationsService from './content-conversations'
import type { AuthService } from '@worldbrain/memex-common/lib/authentication/types'

export function createServices(options: {
    authService: AuthService
    backend: 'firebase' | 'memory'
    serverStorage: ServerStorage
}): Services {
    const { modules: storageModules } = options.serverStorage
    if (options.backend === 'memory') {
        return {
            contentSharing: new ListKeysService({
                serverStorage: storageModules.contentSharing,
            }),
            contentConversations: new ContentConversationsService({
                services: { auth: options.authService },
                storage: {
                    contentConversations: storageModules.contentConversations,
                },
            }),
            activityStreams: new MemoryStreamsService({
                storage: {
                    contentConversations: storageModules.contentConversations,
                    contentSharing: storageModules.contentSharing,
                    users: storageModules.users,
                },
                getCurrentUserId: async () => {
                    const currentUser = await options.authService.getCurrentUser()
                    return currentUser?.id ?? null
                },
            }),
        }
    }

    return {
        contentSharing: new ListKeysService({
            serverStorage: storageModules.contentSharing,
        }),
        contentConversations: new ContentConversationsService({
            services: { auth: options.authService },
            storage: {
                contentConversations: storageModules.contentConversations,
            },
        }),
        activityStreams: new FirebaseFunctionsActivityStreamsService({
            executeCall: async (name, params) => {
                const result = await httpsCallable(getFunctions(), name)(params)
                return result.data
            },
        }),
    }
}

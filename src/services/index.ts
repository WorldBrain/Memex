import { httpsCallable, getFunctions } from 'firebase/functions'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import type { ServerStorage } from 'src/storage/types'
import type { Services } from './types'
import ListKeysService from './content-sharing'
import ContentConversationsService from './content-conversations'
import type { AuthService } from '@worldbrain/memex-common/lib/authentication/types'

export async function createServices(options: {
    authService: AuthService
    manifestVersion: '2' | '3'
    backend: 'firebase' | 'memory'
    getServerStorage: () => Promise<ServerStorage>
}): Promise<Services> {
    const { modules: storageModules } = await options.getServerStorage()
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
                getCurrentUserId: async () =>
                    (await options.authService.getCurrentUser()).id,
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

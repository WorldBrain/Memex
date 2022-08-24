import { getToken } from 'firebase/messaging'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { subscriptionRedirect } from 'src/authentication/background/redirect'
import type { ServerStorage } from 'src/storage/types'
import type { Services } from './types'
import ListKeysService from './content-sharing'
import ContentConversationsService from './content-conversations'
import type { LoginHooks } from '@worldbrain/memex-common/lib/authentication/types'

export async function createServices(options: {
    manifestVersion: '2' | '3'
    backend: 'firebase' | 'memory'
    getServerStorage: () => Promise<ServerStorage>
}): Promise<Services> {
    const { modules: storageModules } = await options.getServerStorage()
    if (options.backend === 'memory') {
        const auth = new MemoryAuthService()

        return {
            auth,
            contentSharing: new ListKeysService({
                serverStorage: storageModules.contentSharing,
            }),
            contentConversations: new ContentConversationsService({
                services: { auth },
                storage: {
                    contentConversations: storageModules.contentConversations,
                },
            }),
            subscriptions: new MemorySubscriptionsService(),
            activityStreams: new MemoryStreamsService({
                storage: {
                    contentConversations: storageModules.contentConversations,
                    contentSharing: storageModules.contentSharing,
                    users: storageModules.users,
                },
                getCurrentUserId: async () => (await auth.getCurrentUser()).id,
            }),
        }
    }

    const loginHooks: LoginHooks =
        options.manifestVersion === '3'
            ? {
                  onPostLogin: async (user) => {
                      const token = await getToken(getMessaging(), {
                          vapidKey: process.env.FCM_VAPID_KEY,
                      })
                      await storageModules.users.addUserFCMRegistrationToken(
                          { id: user.id, type: 'user-reference' },
                          token,
                      )
                  },
                  onPostLogout: async () => {
                      const token = await getToken(getMessaging(), {
                          vapidKey: process.env.FCM_VAPID_KEY,
                      })
                      await storageModules.users.deleteUserFCMRegistrationToken(
                          token,
                      )
                  },
              }
            : {}

    const authDeps = createAuthDependencies({
        loginHooks,
        redirectUrl: subscriptionRedirect,
        devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
    })

    return {
        auth: authDeps.authService,
        contentSharing: new ListKeysService({
            serverStorage: storageModules.contentSharing,
        }),
        contentConversations: new ContentConversationsService({
            services: { auth: authDeps.authService },
            storage: {
                contentConversations: storageModules.contentConversations,
            },
        }),
        subscriptions: authDeps.subscriptionService,
        activityStreams: new FirebaseFunctionsActivityStreamsService({
            executeCall: async (name, params) => {
                const result = await httpsCallable(getFunctions(), name)(params)
                return result.data
            },
        }),
    }
}

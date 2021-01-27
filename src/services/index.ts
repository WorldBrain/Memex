import firebaseModule from 'firebase'
import { ActivityStreamsService } from '@worldbrain/memex-common/lib/activity-streams/types'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import { AuthService } from '@worldbrain/memex-common/lib/authentication/types'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { subscriptionRedirect } from 'src/authentication/background/redirect'
import { ServerStorage } from 'src/storage/types'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'

export interface Services {
    auth: AuthService
    subscriptions: SubscriptionsService
    activityStreams: ActivityStreamsService
}

export async function createServices(options: {
    backend: 'memory'
    firebase?: typeof firebaseModule
    getServerStorage: () => Promise<ServerStorage>
}): Promise<Services> {
    const { storageModules } = await options.getServerStorage()
    let auth: AuthService
    let subscriptions: SubscriptionsService

    if (options.backend === 'memory') {
        subscriptions = new MemorySubscriptionsService()
        auth = new MemoryAuthService()
    } else {
        const authDeps = createAuthDependencies({
            redirectUrl: subscriptionRedirect,
            devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
        })

        subscriptions = authDeps.subscriptionService
        auth = authDeps.authService
    }

    const activityStreams =
        options.backend === 'memory'
            ? new MemoryStreamsService({
                  storage: {
                      contentConversations: storageModules.contentConversations,
                      contentSharing: storageModules.contentSharing,
                      users: storageModules.userManagement,
                  },
                  getCurrentUserId: async () =>
                      (await auth.getCurrentUser()).id,
              })
            : new FirebaseFunctionsActivityStreamsService({
                  executeCall: async (name, params) => {
                      const functions = (
                          options.firebase ?? firebaseModule
                      ).functions()
                      const result = await functions.httpsCallable(name)(params)
                      return result.data
                  },
              })

    return {
        auth,
        subscriptions,
        activityStreams,
    }
}

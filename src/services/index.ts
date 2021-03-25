import firebaseModule from 'firebase'
import FirebaseFunctionsActivityStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/firebase-functions/client'
import MemoryStreamsService from '@worldbrain/memex-common/lib/activity-streams/services/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { subscriptionRedirect } from 'src/authentication/background/redirect'
import { ServerStorage } from 'src/storage/types'
import { Services } from './types'
import ContentSharingService from './content-sharing'

export async function createServices(options: {
    backend: 'firebase' | 'memory'
    firebase?: typeof firebaseModule
    getServerStorage: () => Promise<ServerStorage>
}): Promise<Services> {
    const { storageModules } = await options.getServerStorage()
    if (options.backend === 'memory') {
        const auth = new MemoryAuthService()

        return {
            auth,
            contentSharing: new ContentSharingService({
                storage: { contentSharing: storageModules.contentSharing },
            }),
            subscriptions: new MemorySubscriptionsService(),
            activityStreams: new MemoryStreamsService({
                storage: {
                    contentConversations: storageModules.contentConversations,
                    contentSharing: storageModules.contentSharing,
                    users: storageModules.userManagement,
                },
                getCurrentUserId: async () => (await auth.getCurrentUser()).id,
            }),
        }
    }

    const authDeps = createAuthDependencies({
        redirectUrl: subscriptionRedirect,
        devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
    })

    return {
        auth: authDeps.authService,
        contentSharing: new ContentSharingService({
            storage: { contentSharing: storageModules.contentSharing },
        }),
        subscriptions: authDeps.subscriptionService,
        activityStreams: new FirebaseFunctionsActivityStreamsService({
            executeCall: async (name, params) => {
                const functions = (
                    options.firebase ?? firebaseModule
                ).functions()
                const result = await functions.httpsCallable(name)(params)
                return result.data
            },
        }),
    }
}

import { getToken } from 'firebase/messaging'
import { getMessaging } from 'firebase/messaging/sw'
import type { AuthServices } from './types'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import type { LoginHooks } from '@worldbrain/memex-common/lib/authentication/types'
import type { ServerStorage } from 'src/storage/types'
import { subscriptionRedirect } from 'src/authentication/background/redirect'

export function createAuthServices(options: {
    manifestVersion: '2' | '3'
    backend: 'firebase' | 'memory'
    getServerStorage: () => Promise<ServerStorage>
}): AuthServices {
    if (options.backend === 'memory') {
        return {
            auth: new MemoryAuthService(),
            subscriptions: new MemorySubscriptionsService(),
        }
    }

    const loginHooks: LoginHooks =
        options.manifestVersion === '3'
            ? {
                  onPostLogin: async (user) => {
                      const { modules } = await options.getServerStorage()
                      const token = await getToken(getMessaging(), {
                          vapidKey: process.env.FCM_VAPID_KEY,
                      })
                      await modules.users.addUserFCMRegistrationToken(
                          { id: user.id, type: 'user-reference' },
                          token,
                      )
                  },
                  onPostLogout: async () => {
                      const { modules } = await options.getServerStorage()
                      const token = await getToken(getMessaging(), {
                          vapidKey: process.env.FCM_VAPID_KEY,
                      })
                      await modules.users.deleteUserFCMRegistrationToken(token)
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
        subscriptions: authDeps.subscriptionService,
    }
}

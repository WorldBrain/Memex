import type { AuthServices } from './types'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import type { ServerStorage } from 'src/storage/types'
import { subscriptionRedirect } from 'src/authentication/background/redirect'

export function createAuthServices(options: {
    backend: 'firebase' | 'memory'
    getServerStorage: () => Promise<ServerStorage>
}): AuthServices {
    if (options.backend === 'memory') {
        return {
            auth: new MemoryAuthService(),
            subscriptions: new MemorySubscriptionsService(),
        }
    }

    const authDeps = createAuthDependencies({
        redirectUrl: subscriptionRedirect,
        devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
    })

    return {
        auth: authDeps.authService,
        subscriptions: authDeps.subscriptionService,
    }
}

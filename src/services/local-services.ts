import type { AuthServices } from './types'
import {
    createAuthDependencies,
    DevAuthState,
} from 'src/authentication/background/setup'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'

export function createAuthServices(options: {
    backend: 'firebase' | 'memory'
}): AuthServices {
    if (options.backend === 'memory') {
        return {
            auth: new MemoryAuthService(),
            subscriptions: new MemorySubscriptionsService(),
        }
    }

    const authDeps = createAuthDependencies({
        redirectUrl: 'https://memex.cloud/auth/chargebee/callback',
        devAuthState: process.env.DEV_AUTH_STATE as DevAuthState,
    })

    return {
        auth: authDeps.authService,
        subscriptions: authDeps.subscriptionService,
    }
}

import { AuthService } from 'src/authentication/background/auth-service'
import {
    FirebaseFunctionsAuth,
    FirebaseFunctionsSubscription,
} from 'src/authentication/background/firebase-functions-subscription'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthFirebase } from 'src/authentication/background/auth-firebase'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

export class AuthBackground {
    authService: AuthService
    subscriptionServerFunctions: FirebaseFunctionsSubscription
    authServerFunctions: FirebaseFunctionsAuth

    constructor(
        authService: AuthService = null,
        subscriptionServerFunctions: FirebaseFunctionsSubscription = null,
        authServerFunctions: FirebaseFunctionsAuth = null,
    ) {
        if (authService != null) {
            this.authService = authService
        } else {
            let authImplementation

            // If we're in development and have set auth off, use the mock (todo: in memory implementation)
            if (!process.env.AUTH_ENABLED) {
                authImplementation = new MockAuthImplementation()
            } else if (AuthService.isEnabledByUser) {
                authImplementation = new AuthFirebase()
            } else {
                // todo: use a null implementation
                authImplementation = new MockAuthImplementation()
            }
            this.authService = new AuthService(authImplementation)
        }

        this.subscriptionServerFunctions =
            subscriptionServerFunctions || new FirebaseFunctionsSubscription()
        this.authServerFunctions =
            authServerFunctions || new FirebaseFunctionsAuth()
    }

    registerRemoteEmitter() {
        this.authService.registerAuthEmitter(remoteEventEmitter('auth'))
    }
}

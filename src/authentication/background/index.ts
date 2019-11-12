import { AuthService } from 'src/authentication/background/auth-service'
import {
    FirebaseFunctionsAuth,
    FirebaseFunctionsSubscription,
} from 'src/authentication/background/firebase-functions-subscription'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthFirebase } from 'src/authentication/background/auth-firebase'
import { MockAuthImplementation } from 'src/authentication/background/mocks/auth-mocks'

// TODO: (ch) (opt-out-auth): Allow user to opt-in. Either use an opt-out / null implementation or provide a global condition,
// allowing the implementation / service to be reconfigured when the user opt-in changes.
export class AuthBackground {
    authService: AuthService
    subscriptionServerFunctions: FirebaseFunctionsSubscription
    authServerFunctions: FirebaseFunctionsAuth

    constructor(options: {
        authService?: AuthService
        subscriptionServerFunctions?: FirebaseFunctionsSubscription
        authServerFunctions?: FirebaseFunctionsAuth
        devAuthState?: string
    }) {
        const devAuthState = (options && options.devAuthState) || ''
        if (options.authService != null) {
            this.authService = options.authService
        } else {
            if (devAuthState === '' || devAuthState === 'staging') {
                this.authService = new AuthService(new AuthFirebase())
            } else {
                // todo: (ch): Clean up the creation of these testing states, might not want to be done here.
                let mockAuthImplementation
                if (devAuthState === 'user_signed_out') {
                    mockAuthImplementation = MockAuthImplementation.newUser()
                } else if (devAuthState === 'user_signed_in') {
                    mockAuthImplementation = new MockAuthImplementation()
                    mockAuthImplementation.setCurrentUserToLoggedInUser()
                } else if (devAuthState.startsWith('user_subscribed')) {
                    // todo: (ch): allow testing of different plans
                    mockAuthImplementation = MockAuthImplementation.validSubscriptions()
                    mockAuthImplementation.setCurrentUserToLoggedInUser()
                }
                this.authService = new AuthService(mockAuthImplementation)
            }
        }

        this.subscriptionServerFunctions =
            options.subscriptionServerFunctions ||
            new FirebaseFunctionsSubscription()
        this.authServerFunctions =
            options.authServerFunctions || new FirebaseFunctionsAuth()
    }

    registerRemoteEmitter() {
        this.authService.registerAuthEmitter(remoteEventEmitter('auth'))
    }
}

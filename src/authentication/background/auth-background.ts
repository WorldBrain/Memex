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

    constructor(
        authService: AuthService = null,
        subscriptionServerFunctions: FirebaseFunctionsSubscription = null,
        authServerFunctions: FirebaseFunctionsAuth = null,
    ) {
        if (authService != null) {
            this.authService = authService
        } else {
            if (
                process.env.DEV_AUTH_STATE === '' ||
                process.env.DEV_AUTH_STATE === 'staging'
            ) {
                this.authService = new AuthService(new AuthFirebase())
            } else {
                // todo: (ch): Clean up the creation of these testing states, might not want to be done here.
                let mockAuthImplementation
                if (process.env.DEV_AUTH_STATE === 'user_signed_out') {
                    mockAuthImplementation = MockAuthImplementation.newUser()
                } else if (process.env.DEV_AUTH_STATE === 'user_signed_in') {
                    mockAuthImplementation = new MockAuthImplementation()
                    mockAuthImplementation.setCurrentUserToLoggedInUser()
                } else if (
                    process.env.DEV_AUTH_STATE.startsWith('user_subscribed')
                ) {
                    // todo: (ch): allow testing of different plans
                    mockAuthImplementation = MockAuthImplementation.validSubscriptions()
                    mockAuthImplementation.setCurrentUserToLoggedInUser()
                }
                this.authService = new AuthService(mockAuthImplementation)
            }
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

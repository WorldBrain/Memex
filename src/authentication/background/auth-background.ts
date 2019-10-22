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
            // If we're in development and have set auth off, use the mock (todo: in memory implementation)
            // tslint:disable-next-line:prefer-conditional-expression
            if (process.env.AUTH_ENABLED !== 'true') {
                this.authService = new AuthService(
                    MockAuthImplementation.validProSubscription(),
                )
            } else {
                this.authService = new AuthService(new AuthFirebase())
                // if (AuthService.isEnabledByUser) {
                //     authImplementation = new AuthFirebase()
                // } else {
                //     // TODO: (ch) (opt-out-auth): use a null implementation until user enabled auth and then reconfigure the backend once they do
                //     authImplementation = new AuthDisabled()
                // }
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

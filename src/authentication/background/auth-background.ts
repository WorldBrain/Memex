import { AuthService } from 'src/authentication/background/auth-service'
import {
    FirebaseFunctionsAuth,
    FirebaseFunctionsSubscription,
} from 'src/authentication/background/firebase-functions-subscription'
import { remoteEventEmitter } from 'src/util/webextensionRPC'
import { AuthFirebase } from 'src/authentication/background/auth-firebase'

export class AuthBackground {
    authService: AuthService
    subscriptionServerFunctions: FirebaseFunctionsSubscription
    authServerFunctions: FirebaseFunctionsAuth

    constructor(
        authService: AuthService = null,
        subscriptionServerFunctions: FirebaseFunctionsSubscription = null,
        authServerFunctions: FirebaseFunctionsAuth = null,
    ) {
        this.authService = authService || new AuthService(new AuthFirebase())
        this.subscriptionServerFunctions =
            subscriptionServerFunctions || new FirebaseFunctionsSubscription()
        this.authServerFunctions =
            authServerFunctions || new FirebaseFunctionsAuth()
    }

    registerRemoteEmitter() {
        this.authService.registerAuthEmitter(remoteEventEmitter('auth'))
    }
}

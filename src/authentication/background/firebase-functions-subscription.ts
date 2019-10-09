import { firebase } from 'src/util/firebase-app-initialized'
import 'firebase/functions'
import {
    AuthServerFunctionsInterface,
    SubscriptionServerFunctionsInterface,
} from 'src/authentication/background/types'

// Test with the local function emulator if specified
if (
    process.env.NODE_ENV !== 'production' &&
    process.env.LOCAL_AUTH_SERVICE === 'true'
) {
    firebase.functions().useFunctionsEmulator('http://localhost:5001')
}

/**
 * Get's links to checkout or manage a subscription via Chargebee.
 * This involves calling a Firebase function, which communicates with the Chargebee API
 * in order to request the link for the authenticated user.
 */
export class FirebaseFunctionsSubscription
    implements SubscriptionServerFunctionsInterface {
    async getCheckoutLink(options): Promise<string> {
        const result = await firebase
            .functions()
            .httpsCallable('getCheckoutLink')(options)

        if (result.data != null) {
            return result.data['hosted_page']
        }
    }

    async getManageLink(options): Promise<string> {
        const result = await firebase
            .functions()
            .httpsCallable('getManageLink')(options)

        if (result.data != null) {
            return result.data['portal_session']
        }
    }
}
export class FirebaseFunctionsAuth implements AuthServerFunctionsInterface {
    async refreshUserClaims(): Promise<any> {
        return firebase.functions().httpsCallable('refreshUserClaims')()
    }
}

import * as firebase from 'firebase/app'
import 'firebase/functions'
import {
    AuthServerFunctionsInterface,
    SubscriptionServerFunctionsInterface,
} from 'src/authentication/background/types'

/**
 * Get's links to checkout or manage a subscription via Chargebee.
 * This involves calling a Firebase function, which communicates with the Chargebee API
 * in order to request the link for the authenticated user.
 */
// todo (ch): check for errors and nulls
export class FirebaseFunctionsSubscription
    implements SubscriptionServerFunctionsInterface {
    async getCheckoutLink(options): Promise<string> {
        const result = await firebase
            .functions()
            .httpsCallable('getCheckoutLink')(options)
        return result.data['hosted_page']
    }

    async getManageLink(options): Promise<string> {
        const result = await firebase
            .functions()
            .httpsCallable('getManageLink')(options)
        return result.data['portal_session']
    }
}
export class FirebaseFunctionsAuth implements AuthServerFunctionsInterface {
    async refreshUserClaims(): Promise<any> {
        return firebase.functions().httpsCallable('refreshUserClaims')()
    }
}

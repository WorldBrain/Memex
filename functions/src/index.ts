import * as functions from 'firebase-functions'
import {
    CallableContext,
    Request,
} from 'firebase-functions/lib/providers/https'
import * as admin from 'firebase-admin'
const chargebee = require('chargebee')

const hostedPage = Symbol('hosted_page')
const portalSession = Symbol('portal_session')
/**
 * Helper to format consistent error responses from this API
 */
const errorResponse = (type: string, message: string) => ({
    error: type,
    message,
})

const notAuthenticatedResponse = errorResponse('auth', 'Not Authenticated')

/**
 * Helper function to extract user details from firebase function auth context object
 */
const getUser = (context: any) => ({
    id: context.auth.uid,
    email: context.auth.token.email,
})

/**
 * Helper function to extract Chargebee config from firebase function config
 */
const getChargebeeOptions = () => ({
    site: functions.config().chargebee.site,
    api_key: functions.config().chargebee.apiKey,
})

/**
 *  Creates a function to return Chargebee API responses consistently
 *  using the provided object key to access a hosted page url.
 * @param pageKey
 */
const resultFormatter = (pageKey: symbol) => (error: any, result: any) => {
    if (error != null) {
        return errorResponse('provider', error)
    }

    if (result[pageKey] == null) {
        return errorResponse(
            'provider',
            `No hosted page returned for ${pageKey.toString()}`,
        )
    }

    return { result: { url: result[pageKey].url } }
}

/**
 * Firebase Function
 *
 * Calls the Chargebee API to return a link to a hosted page,
 * to Checkout a plan for the authenticated user.
 */
const getCheckoutLink = functions.https.onCall(
    async (data: any, context: CallableContext) => {
        if (context.auth == null) {
            return notAuthenticatedResponse
        }

        // todo: move this up to the global import runtime context if the tests are okay with it
        chargebee.configure(getChargebeeOptions())

        const checkoutOptions = {
            subscription: { plan_id: data.planId },
            customer: getUser(context),
        }

        return chargebee.hosted_page
            .checkout_new(checkoutOptions)
            .request(resultFormatter(hostedPage))
    },
)

/**
 * Firebase Function
 *
 * Calls the Chargebee API to return a link to a hosted page,
 * to manage subscriptions for the authenticated user.
 */
const getManageLink = functions.https.onCall(
    async (data: any, context: CallableContext) => {
        if (context.auth == null) {
            return notAuthenticatedResponse
        }

        chargebee.configure(getChargebeeOptions())

        const portalOptions = {
            redirect_url: data.redirectUrl,
            customer: getUser(context),
        }

        return chargebee.portal_session
            .create(portalOptions)
            .request(resultFormatter(portalSession))
    },
)

/**
 * Shared Function
 *
 * Refresh a user's subscription status - Asks Chargebee for the subscription status for this user,
 * then updates the value in the JWT auth token's user claims.
 *
 * todo: Question: do we need to store this in a Firestore user database too?
 */
interface Claims {
    subscriptions: { [key: string]: { refreshAt: number } }
    lastSubscribed: number | null
}
const _refreshUserSubscriptionStatus = async (userId: string) => {
    chargebee.configure(getChargebeeOptions())

    const claims: Claims = {
        subscriptions: {},
        lastSubscribed: null,
    }

    const subscriptionQuery = {
        customer_id: userId,
        'sort_by[asc]': 'created_at',
    }

    // Query the Chargebee API for this user's subscriptions, adding every active/in_trial sub to the claims object.
    // any past subscription updates the lastSubscribed property to know whether a user has subscribed in the past.
    await chargebee.subscription
        .list(subscriptionQuery)
        .request(function(error: any, result: any) {
            if (error) {
                return errorResponse('Provider', error)
            } else {
                for (const entry of result.list) {
                    if (
                        entry.subscription.status === 'active' ||
                        entry.subscription.status === 'in_trial'
                    ) {
                        // TODO: verify `next_billing_at` is the right thing to refresh on and not `current_term_end`
                        claims.subscriptions[entry.subscription.plan_id] = {
                            refreshAt: entry.subscription.next_billing_at,
                        }
                    }
                    claims.lastSubscribed = entry.subscription.createdAt
                }
                return
            }
        })

    // N.B. Claims are always reset, not additive
    await admin.auth().setCustomUserClaims(userId, claims)

    return { result: true }
}

/**
 * Firebase Function
 *
 * Calls the refresh function above with the authenticated user's details
 */
const refreshUserSubscriptionStatus = functions.https.onCall(
    async (data: any, context: CallableContext) => {
        if (context.auth == null) {
            return notAuthenticatedResponse
        }

        // Enhancement: add rate limiting to this function

        return _refreshUserSubscriptionStatus(context.auth.uid)
    },
)

/**
 * Firebase HTTP Function (server - server) (webhook)
 *
 * Called by the Chargebee API when a user subscription changes
 * Calls the refresh function above with the specified user's details
 *
 * TODO: Implement Tests and Implementation for this webhook
 */
const userSubscriptionChanged = functions.https.onRequest(
    (req: Request, resp: any) => {
        // TODO: Verify secret or host
        // TODO: Filter types of subscription change
        // TODO: Get userId
        const userId = ''
        return _refreshUserSubscriptionStatus(userId)
    },
)

export {
    getManageLink,
    getCheckoutLink,
    refreshUserSubscriptionStatus,
    userSubscriptionChanged,
}

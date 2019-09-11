import * as functions from 'firebase-functions'
const chargebee = require('chargebee')

export const getCheckoutLink = functions.https.onCall(async (data, context) => {
    if (context.auth == null) {
        return { error: 'auth', message: 'Not Authenticated' }
    }

    chargebee.configure({
        site: functions.config().chargebee.site,
        api_key: functions.config().chargebee.apiKey,
    })

    return chargebee.hosted_page
        .checkout_new({
            subscription: {
                plan_id: data.planId,
            },
            customer: {
                id: context.auth.uid,
                email: context.auth.token.email,
            },
        })
        .request(function(error: any, result: any) {
            return result.hosted_page
        })
})

export const getManageLink = functions.https.onCall(async (data, context) => {
    if (context.auth == null) {
        return { error: 'auth', message: 'Not Authenticated' }
    }

    chargebee.configure({
        site: functions.config().chargebee.site,
        api_key: functions.config().chargebee.apiKey,
    })

    return chargebee.portal_session
        .create({
            redirect_url: data.redirectUrl,
            customer: {
                id: context.auth.uid,
                email: context.auth.token.email,
            },
        })
        .request(function(error: any, result: any) {
            return result.portal_session
        })
})

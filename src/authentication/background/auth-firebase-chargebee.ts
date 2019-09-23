import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/functions'

import {
    AuthInterface,
    Claims,
    SubscriptionCheckoutOptions,
    SubscriptionCheckoutEventEmitter,
    SubscriptionManageEventEmitter,
    AuthRemoteFunctionsInterface,
    SubscriptionRemoteFunctionsInterface,
} from 'src/authentication/background/types'
import { AuthService } from 'src/authentication/background/auth-service'
import { EventEmitter } from 'events'
// todo: make sure firebase is initialised somewhere
const functions = null

export class AuthFirebaseChargebee
    implements AuthInterface<ChargebeeSubscriptionInterface> {
    public readonly subscription = new ChargeBeeSubscription()

    async getCurrentUser(): Promise<any> {
        const id = firebase.auth().currentUser
        return { id }
    }

    async getUserClaims(): Promise<Claims> {
        const idTokenResult = await firebase
            .auth()
            .currentUser.getIdTokenResult()
        return idTokenResult.claims as Claims
    }

    async refresh() {
        // Call Firebase function to read the user's subscription status out of the database/Shop provider
        // which resets the claims.
        // Then refresh the client token
        return null
    }
}

// Todo: What does chargbee call it's steps?
export type ChargeeCheckoutStepEvents = 'step1' | 'step2'
export type ChargeeManageStepEvents = 'step1' | 'step2'

export interface ChargebeeInterface {
    openCheckout: ({ hostedPage, success, close, step }) => any
    manage: ({ hostedPage }) => any
}

export interface ChargebeeSubscriptionInterface {
    checkout(
        options: SubscriptionCheckoutOptions,
        cbInstance: ChargebeeInterface,
    ): Promise<SubscriptionCheckoutEventEmitter<ChargeeCheckoutStepEvents>>
    manage(
        cbInstance: ChargebeeInterface,
    ): Promise<SubscriptionManageEventEmitter<ChargeeManageStepEvents>>
}

class ChargeBeeSubscription
    implements
        ChargebeeSubscriptionInterface,
        SubscriptionRemoteFunctionsInterface {
    async checkout(
        options: SubscriptionCheckoutOptions,
        cbInstance: ChargebeeInterface,
    ) {
        const checkoutOptions = {
            plan: options.subscriptionPlanId,
        }

        const eventEmitter = new EventEmitter() as SubscriptionCheckoutEventEmitter<
            ChargeeCheckoutStepEvents
        >
        const checkoutExternalUrl = await FirebaseChargebeeLinks.checkout(
            checkoutOptions,
        )
        eventEmitter.emit('externalUrl', checkoutExternalUrl)

        cbInstance.openCheckout({
            hostedPage: checkoutExternalUrl,
            success: hostedPageId => eventEmitter.emit('success', hostedPageId),
            close: () => eventEmitter.emit('closed'),
            step: step => eventEmitter.emit('subscriptionStepChanged', step),
        })

        return eventEmitter
    }

    async manage(cbInstance: ChargebeeInterface) {
        // todo: (ch) find out what events this emitts and return them

        const manageExternalUrl = await FirebaseChargebeeLinks.manage({})

        // todo: (ch) what's the correct method here?
        cbInstance.manage({
            hostedPage: manageExternalUrl,
        })

        return new EventEmitter() as SubscriptionManageEventEmitter<
            ChargeeManageStepEvents
        >
    }
}

/**
 * Get's links to checkout or manage a subscription via Chargebee.
 * This involves calling a Firebase function, which communicates with the Chargebee API
 * in order to request the link for the authenticated user.
 */
export class FirebaseChargebeeLinks {
    static async checkout(options): Promise<string> {
        return (await firebase.functions().httpsCallable('getCheckoutLink')(
            options,
        )).data
    }

    static async manage(options): Promise<string> {
        return (await firebase.functions().httpsCallable('getManageLink')(
            options,
        )).data
    }
}

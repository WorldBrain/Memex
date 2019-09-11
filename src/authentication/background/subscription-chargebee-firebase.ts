import {
    SubscriptionInterface,
    SubscriptionCheckoutOptions,
    LinkGeneratorInterface,
    SubscriptionEventEmitter,
} from 'src/authentication/background/types'
import { EventEmitter } from 'events'
import { AuthService } from 'src/authentication/background/auth-service'
import * as firebase from 'firebase'

// todo: make sure firebase is initialised somewhere
const functions = firebase.functions()
// Required for side-effects
require('firebase/functions')

// Todo: What does chargbee call it's steps?
type ChargeeCheckoutStepEvents = 'step1' | 'step2'

export interface ChargebeeInterface {
    openCheckout: ({ hostedPage, success, close, step }) => any
}

export class SubscriptionChargebeeFirebase
    implements SubscriptionInterface<ChargeeCheckoutStepEvents> {
    private cbInstance: any
    private links: LinkGeneratorInterface
    private eventEmitter: SubscriptionEventEmitter<ChargeeCheckoutStepEvents>

    constructor(
        linkGenerator?: LinkGeneratorInterface,
        chargebeeInstance?: ChargebeeInterface,
    ) {
        this.links = linkGenerator || new FirebaseChargebeeLinks()
        // todo: Add env variable for chargebee site id
        // todo: how to access chargebee library, they don't publish their client package as an npm module, just a hosted JS script
        this.cbInstance =
            chargebeeInstance ||
            document.Chargebee.init({ site: 'TODO:ENV:CONFIG:ChargebeeSite' })
    }

    async checkout(auth: AuthService, options: SubscriptionCheckoutOptions) {
        const user = await auth.getUser()
        if (user == null) {
            throw Error('User cannot be null when checking out')
        }

        const checkoutOptions = {
            userId: user.id,
            plan: options.subscriptionPlanId,
            hasSubscribedBefore: await auth.hasSubscribedBefore(),
        }

        this.eventEmitter = new EventEmitter() as SubscriptionEventEmitter<
            ChargeeCheckoutStepEvents
        >

        const checkoutExternalUrl = await this.links.checkout(checkoutOptions)
        this.eventEmitter.emit('externalUrl', checkoutExternalUrl)

        this.cbInstance.openCheckout({
            hostedPage: checkoutExternalUrl,
            success: hostedPageId =>
                this.eventEmitter.emit('success', hostedPageId),
            close: () => this.eventEmitter.emit('closed'),
            step: step =>
                this.eventEmitter.emit('subscriptionStepChanged', step),
        })

        return this.eventEmitter
    }

    manage() {
        // todo
        return undefined
    }
}

class FirebaseChargebeeLinks implements LinkGeneratorInterface {
    async checkout(options): Promise<string> {
        return firebase.functions().httpsCallable('getCheckoutLink')(options)
    }

    async manage(options): Promise<string> {
        return firebase.functions().httpsCallable('getManageLink')(options)
    }
}

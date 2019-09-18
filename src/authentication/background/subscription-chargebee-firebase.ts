import {
    SubscriptionInterface,
    SubscriptionCheckoutOptions,
    LinkGeneratorInterface,
    SubscriptionEventEmitter,
} from 'src/authentication/background/types'
import { EventEmitter } from 'events'
import { AuthService } from 'src/authentication/background/auth-service'
import * as firebase from 'firebase/app'
import 'firebase/functions'
// todo: make sure firebase is initialised somewhere
const functions = null

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
        linkGenerator: LinkGeneratorInterface,
        chargebeeInstance: ChargebeeInterface,
    ) {
        this.cbInstance = chargebeeInstance
        this.links = linkGenerator
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

export class FirebaseChargebeeLinks implements LinkGeneratorInterface {
    async checkout(options): Promise<string> {
        return (await firebase.functions().httpsCallable('getCheckoutLink')(
            options,
        )).data
    }

    async manage(options): Promise<string> {
        return (await firebase.functions().httpsCallable('getManageLink')(
            options,
        )).data
    }
}

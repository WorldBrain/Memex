import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'
import { serverFunctions } from 'src/util/remote-functions-background'

export class UserSubscription {
    private cbInstance: any

    constructor(chargebeeInstance) {
        this.cbInstance = chargebeeInstance
    }

    async checkoutUserSubscription(options: SubscriptionCheckoutOptions) {
        const eventEmitter = new EventEmitter() as SubscriptionCheckoutEventEmitter<
            ChargeeCheckoutStepEvents
        >

        const getExternalUrl = async () => {
            const checkoutExternalUrl = await serverFunctions.getCheckoutLink(
                options,
            )
            eventEmitter.emit('externalUrl', checkoutExternalUrl)
            return checkoutExternalUrl
        }

        // todo: (ch) type eventEmitter
        this.cbInstance.openCheckout({
            hostedPage: getExternalUrl,
            success: hostedPageId => eventEmitter.emit('success', hostedPageId),
            close: () => eventEmitter.emit('closed'),
            step: step => eventEmitter.emit('subscriptionStepChanged', step),
        })
        return eventEmitter
    }

    async manageUserSubscription(options: SubscriptionCheckoutOptions) {
        // todo: (ch) provide a way to close this box on parent component unmount
        // todo: (ch) find out what events this emits and return them
        // todo: (ch) what's the correct method here?
        const res = await this.cbInstance.setPortalSession(async () => {
            let s = await serverFunctions.getManageLink(options)
            return s
        })

        const cbPortal = this.cbInstance.createChargebeePortal()
        cbPortal.open({
            close() {
                // todo: close callbacks
            },
        })

        return new EventEmitter() as SubscriptionManageEventEmitter<
            ChargeeManageStepEvents
        >
    }
}

export interface ChargebeeSubscriptionInterface {
    checkoutUserSubscription(
        options: SubscriptionCheckoutOptions,
    ): Promise<SubscriptionCheckoutEventEmitter<ChargeeCheckoutStepEvents>>

    manageUserSubscription(): Promise<
        SubscriptionManageEventEmitter<ChargeeManageStepEvents>
    >
}

// Todo: What does chargbee call it's steps?
export type ChargeeCheckoutStepEvents = 'step' | 'step2'
export type ChargeeManageStepEvents = 'step1' | 'step2'

export interface ChargebeeInterface {
    openCheckout: ({ hostedPage, success, close, step }) => any
    manage: ({ hostedPage }) => any
}

export type SubscriptionCheckoutEventEmitter<T> = TypedEmitter<
    SubscriptionEvents<T>
>
export type SubscriptionManageEventEmitter<T> = TypedEmitter<
    SubscriptionEvents<T>
>

// todo(ch): Review these Susbcription types, move elsewhere perhaps
export interface SubscriptionCheckoutOptions {
    planId: string
}

export interface SubscriptionEvents<T> {
    error: (error: Error) => void
    externalUrl: (url: string) => void
    started: () => void
    closed: () => void
    success: (id: string) => void
    subscriptionStepChanged: (stepType: T) => void
}

export const subscriptionEventKeys: Array<keyof SubscriptionEvents<any>> = [
    'error',
    'externalUrl',
    'started',
    'closed',
    'success',
    'subscriptionStepChanged',
]

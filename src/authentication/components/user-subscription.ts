import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'
import { serverFunctions } from 'src/util/remote-functions-background'

export class UserSubscription {
    private cbInstance: any

    constructor(chargebeeInstance) {
        this.cbInstance = chargebeeInstance
    }

    async checkoutUserSubscription(options: SubscriptionCheckoutOptions) {
        const eventEmitter = new EventEmitter() as SubscriptionCheckoutEventEmitter

        const getExternalUrl = async () => {
            const checkoutExternalUrl = await serverFunctions.getCheckoutLink(
                options,
            )
            eventEmitter.emit('externalUrl', checkoutExternalUrl)
            return checkoutExternalUrl
        }

        this.cbInstance.openCheckout({
            hostedPage: getExternalUrl,
            success: id => eventEmitter.emit('changed', id),
            close: () => eventEmitter.emit('closed'),
        })
        return eventEmitter
    }

    async manageUserSubscription(options: SubscriptionCheckoutOptions) {
        // todo: (ch) provide a way to close this box on parent component unmount
        await this.cbInstance.setPortalSession(async () => {
            await serverFunctions.getManageLink(options)
        })

        const emitter = new EventEmitter() as SubscriptionManageEventEmitter
        const cbPortal = this.cbInstance.createChargebeePortal()
        cbPortal.open({
            close: () => emitter.emit('closed'),
        })

        return emitter
    }
}

export interface ChargebeeSubscriptionInterface {
    checkoutUserSubscription(
        options: SubscriptionCheckoutOptions,
    ): Promise<SubscriptionCheckoutEventEmitter>

    manageUserSubscription(): Promise<SubscriptionManageEventEmitter>
}

export interface ChargebeeInterface {
    openCheckout: ({ hostedPage, success, close }) => any
    manage: ({ hostedPage }) => any
}

export type SubscriptionCheckoutEventEmitter = TypedEmitter<SubscriptionEvents>
export type SubscriptionManageEventEmitter = TypedEmitter<SubscriptionEvents>

// todo(ch): Review these Susbcription types, move elsewhere perhaps
export interface SubscriptionCheckoutOptions {
    planId: string
}

export interface SubscriptionEvents {
    error: (error: Error) => any
    externalUrl: (url: string) => any
    closed: () => any
    changed: (id: string) => any
}

export const subscriptionEventKeys: Array<keyof SubscriptionEvents> = [
    'error',
    'externalUrl',
    'closed',
    'changed',
]

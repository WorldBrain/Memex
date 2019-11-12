import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'
import { serverFunctions } from 'src/util/remote-functions-background'

interface ChargebeeInstanceInterface {
    setPortalSession(getUrl: () => Promise<string>): void
    createChargebeePortal(): void
    openCheckout({
        hostedPage,
        success,
        close,
    }: {
        hostedPage: () => Promise<string>
        success: (id: string) => void
        close: () => void
    })
}

export class UserSubscription {
    private cbInstance: any

    constructor(chargebeeInstance: ChargebeeInstanceInterface) {
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

    async manageUserSubscription() {
        // todo: (ch) provide a way to close this box on parent component unmount
        await this.cbInstance.setPortalSession(async () => {
            return serverFunctions.getManageLink()
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

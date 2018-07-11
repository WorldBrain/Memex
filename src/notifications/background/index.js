import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import NotificationStorage from './storage'
import * as notifications from '../notifications'
const LAST_NOTIF_TIME = 'last-notif-releast-time'

export default class NotificationBackground {
    constructor({ storageManager }) {
        this.storage = new NotificationStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeNotification: (...params) => {
                return this.storeNotification(...params)
            },
            getUnreadCount: () => {
                return this.getUnreadCount()
            },
            fetchUnreadNotifications: () => {
                return this.fetchUnreadNotifications()
            },
            fetchReadNotifications: (...params) => {
                return this.fetchReadNotifications(...params)
            },
        })
    }

    async storeNotification(request) {
        await this.storage.storeNotification(request)
    }

    async getUnreadCount() {
        return await this.storage.getUnreadCount()
    }

    async fetchUnreadNotifications() {
        return await this.storage.fetchUnreadNotifications()
    }

    /**
     *
     * @param {request} request that contains { limit }
     */
    async fetchReadNotifications(request) {
        return await this.storage.fetchReadNotifications(request)
    }

    async initNotification() {
        const lastReleaseTime = (await browser.storage.local.get(
            LAST_NOTIF_TIME,
        ))[LAST_NOTIF_TIME]

        for (let notification of notifications.NEW_NOTIFS) {
            notification = {
                ...notification,
                deliveredTime: Date.now(),
            }

            if (!lastReleaseTime || lastReleaseTime < notification.sentTime) {
                await this.storeNotification(notification)
            }
        }

        browser.storage.local.set({ [LAST_NOTIF_TIME]: Date.now() })
    }
}

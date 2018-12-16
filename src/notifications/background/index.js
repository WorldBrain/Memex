import {
    makeRemotelyCallable
} from 'src/util/webextensionRPC'
import NotificationStorage from './storage'
import * as notifications from '../notifications'
import createNotif from 'src/util/notifications'
import internalAnalytics from 'src/analytics/internal'
import {
    EVENT_NAMES
} from '../../analytics/internal/constants'
export default class NotificationBackground {
    static LAST_NOTIF_TIME = 'last-notif-proc-timestamp'

    constructor({
        storageManager
    }) {
        this.storage = new NotificationStorage(storageManager)
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeNotification: (...params) => {
                return this.storeNotification(...params)
            },
            fetchUnreadCount: () => {
                return this.fetchUnreadCount()
            },
            fetchUnreadNotifications: () => {
                return this.fetchUnreadNotifications()
            },
            fetchReadNotifications: (...params) => {
                return this.fetchReadNotifications(...params)
            },
            readNotification: id => {
                return this.readNotification(id)
            },
            fetchNotifById: id => {
                return this.fetchNotifById(id)
            },
        })
    }

    async storeNotification(request) {
        await this.storage.storeNotification(request)
    }

    async fetchUnreadCount() {
        return this.storage.fetchUnreadCount()
    }

    async fetchUnreadNotifications() {
        return this.storage.fetchUnreadNotifications()
    }

    /**
     * @param {request} request that contains { limit }
     */
    async fetchReadNotifications(request) {
        return this.storage.fetchReadNotifications(request)
    }

    async readNotification(id) {
        await this.storage.readNotification(id)
    }

    async fetchNotifById(id) {
        return this.storage.fetchNotifById(id)
    }

    async deliverStaticNotifications() {
        const lastReleaseTime = (await browser.storage.local.get(
            NotificationBackground.LAST_NOTIF_TIME,
        ))[NotificationBackground.LAST_NOTIF_TIME]

        for (let notification of notifications.NOTIFS) {
            if (notification.system) {
                if (
                    !lastReleaseTime ||
                    lastReleaseTime < notification.sentTime
                ) {
                    const url = notification.system.buttons[0].action.url

                    // Notification with updates when we update
                    await createNotif({
                            title: notification.system.title,
                            message: notification.system.message,
                        },
                        () => {
                            internalAnalytics.processEvent({
                                type: EVENT_NAMES.CLICK_ON_SYSTEM_NOTIFICATION,
                                details: {
                                    notificationId: notification.id,
                                },
                            })

                            return browser.tabs.create({
                                url
                            })
                        },
                    )
                }
            }

            if (notification.overview) {
                notification = {
                    ...notification.overview,
                    id: notification.id,
                    deliveredTime: Date.now(),
                    sentTime: notifications.releaseTime,
                }

                if (
                    !lastReleaseTime ||
                    lastReleaseTime < notification.sentTime
                ) {
                    await this.storeNotification(notification)
                }
            }
        }

        browser.storage.local.set({
            [NotificationBackground.LAST_NOTIF_TIME]: Date.now(),
        })
    }
}

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import NotificationStorage from './storage'
import * as notifications from '../notifications'
import createNotif from 'src/util/notifications'
import internalAnalytics from 'src/analytics/internal'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { NotifDefinition } from '../types'
import { browser } from 'webextension-polyfill-ts'
import StorageManager from '@worldbrain/storex'

interface OptionalNotificationDependencies {
    eventNotifs: notifications.EventNotifsDict
    updateNotifs: NotifDefinition[]
    releaseTime: number
    createNotif: typeof createNotif
}

interface RequiredNotficationDependencies {
    storageManager: StorageManager
}

export default class NotificationBackground {
    static LAST_NOTIF_TIME = 'last-notif-proc-timestamp'

    storage: NotificationStorage

    private dependencies: RequiredNotficationDependencies &
        OptionalNotificationDependencies

    constructor(
        options: RequiredNotficationDependencies &
            Partial<OptionalNotificationDependencies>,
    ) {
        this.dependencies = {
            eventNotifs: notifications.EVENT_NOTIFS,
            updateNotifs: notifications.UPDATE_NOTIFS,
            releaseTime: notifications.releaseTime,
            createNotif,
            ...options,
        }

        this.storage = new NotificationStorage({
            storageManager: options.storageManager,
        })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable({
            storeNotification: (...params: [any]) => {
                return this.storeNotification(...params)
            },
            fetchUnreadCount: () => {
                return this.fetchUnreadCount()
            },
            fetchUnreadNotifications: () => {
                return this.fetchUnreadNotifications()
            },
            fetchReadNotifications: (...params: [any]) => {
                return this.fetchReadNotifications(...params)
            },
            readNotification: id => {
                return this.readNotification(id)
            },
            fetchNotifById: id => {
                return this.fetchNotifById(id)
            },
            dispatchNotification: notification => {
                return this.dispatchNotification(notification)
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

    async dispatchNotification(
        notifId: string,
        options?: { dontStore?: boolean },
    ) {
        const notification = this.dependencies.eventNotifs[notifId]

        if (notification.overview) {
            const newNotification = {
                ...notification.overview,
                id: notification.id,
                deliveredTime: Date.now(),
                sentTime: this.dependencies.releaseTime,
            }
            // Store the notification so that it displays in the inbox
            if (!options?.dontStore) {
                await this.storeNotification(newNotification)
            }
        }
        if (notification.system) {
            // Check if the system has to be notified or not
            const url = (notification.system.buttons || [])[0]?.action?.url
            // console.log(notification.system.title, 'hello')
            await createNotif(
                {
                    title: notification.system.title,
                    message: notification.system.message,
                    requireInteraction: false,
                },
                () => {
                    if (url) {
                        return browser.tabs.create({
                            url,
                        })
                    }
                },
            )
        }
    }

    async deliverStaticNotifications() {
        const lastReleaseTime = (
            await browser.storage.local.get(
                NotificationBackground.LAST_NOTIF_TIME,
            )
        )[NotificationBackground.LAST_NOTIF_TIME]

        for (let notification of this.dependencies.updateNotifs) {
            if (notification.system) {
                if (
                    !lastReleaseTime ||
                    lastReleaseTime < notification.sentTime
                ) {
                    const url = notification.system.buttons[0].action.url

                    // Notification with updates when we update
                    await createNotif(
                        {
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
                                url,
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
                    sentTime: this.dependencies.releaseTime,
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

import { FeatureStorage } from '../../search/storage'
import * as notifications from '../notifications'
import createNotif from '../../util/notifications'
import { browser } from 'webextension-polyfill-ts'

export default class NotificationStorage extends FeatureStorage {
    static NOTIFS_COLL = 'notifications'

    constructor(storageManager) {
        super(storageManager)

        this.storageManager.registry.registerCollection(
            NotificationStorage.NOTIFS_COLL,
            {
                version: new Date(2018, 7, 4),
                fields: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    message: { type: 'string' },
                    buttonText: { type: 'string' },
                    link: { type: 'string' },
                    sentTime: { type: 'datetime' },
                    deliveredTime: { type: 'datetime' },
                    readTime: { type: 'datetime' },
                },
                indices: [{ field: 'id', pk: true }],
            },
        )
    }

    async storeNotification(notification) {
        await this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .createObject(notification)
    }

    async fetchUnreadNotifications() {
        const opt = {
            reverse: true,
        }

        return this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .findObjects({ readTime: { $exists: false } }, opt)
    }

    async fetchReadNotifications({ limit, skip }) {
        const opt = {
            reverse: true,
            limit,
            skip,
        }

        const results = await this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .findObjects({ readTime: { $exists: true } }, opt)

        return {
            notifications: results,
            resultExhausted: results.length < limit,
        }
    }

    async fetchUnreadCount() {
        return this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .countObjects({
                readTime: { $exists: false },
            })
    }

    async readNotification(id) {
        await this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .updateOneObject(
                { id },
                {
                    $set: {
                        readTime: Date.now(),
                    },
                },
            )
    }

    async fetchNotifById(id) {
        return this.storageManager
            .collection(NotificationStorage.NOTIFS_COLL)
            .findOneObject({ id })
    }

    async dispatchNotification(notification) {
        if (notification.overview) {
            const newNotification = {
                ...notification.overview,
                id: notification.id,
                deliveredTime: Date.now(),
                sentTime: notifications.releaseTime,
            }
            // Store the notification so that it displays in the inbox
            await this.storeNotification(newNotification)
        }
        if (notification.system) {
            // Check if the system has to be notified or not
            const url = notification.system.buttons[0].action.url
            // console.log(notification.system.title, 'hello')
            await createNotif(
                {
                    title: notification.system.title,
                    message: notification.system.message,
                    requireInteraction: false,
                },
                () => {
                    return browser.tabs.create({
                        url,
                    })
                },
            )
        }
    }
}

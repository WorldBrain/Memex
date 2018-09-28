import { FeatureStorage } from '../../search/storage'

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
}

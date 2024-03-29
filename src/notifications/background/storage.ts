import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-common/lib/storage/modules/notifications/constants'

import { Notification } from '../types'

export default class NotificationStorage extends StorageModule {
    static NOTIFS_COLL = COLLECTION_NAMES.notification

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
        },
        operations: {
            createNotification: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'createObject',
            },
            findUnreadNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findObjects',
                args: [
                    { readTime: { $eq: null } },
                    {
                        reverse: true,
                    },
                ],
            },
            findReadNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findObjects',
                args: [
                    { readTime: { $ne: null } },
                    {
                        reverse: true,
                        limit: '$limit:int',
                        skip: '$skip:int',
                    },
                ],
            },
            findNotificationById: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'findObject',
                args: { id: '$id:pk' },
            },
            countNotifications: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'countObjects',
                args: { readTime: { $exists: '$isRead:boolean' } },
            },
            readNotification: {
                collection: NotificationStorage.NOTIFS_COLL,
                operation: 'updateObject',
                args: [
                    { id: '$id:pk' },
                    { $set: { readTime: '$readTime:number' } },
                ],
            },
        },
    })

    async storeNotification(notification: Notification) {
        if (
            !(await this.operation('findNotificationById', {
                id: notification.id,
            }))
        ) {
            notification.readTime = notification.readTime ?? null
            return this.operation('createNotification', notification)
        }
    }

    async fetchUnreadNotifications() {
        return this.operation('findUnreadNotifications', {})
    }

    async fetchReadNotifications({ limit = 10, skip = 0 }) {
        const results = await this.operation('findReadNotifications', {
            limit,
            skip,
        })

        return {
            notifications: results,
            resultExhausted: results.length < limit,
        }
    }

    async fetchUnreadCount() {
        return this.operation('countNotifications', {
            isRead: false,
        })
    }

    async readNotification(id) {
        return this.operation('readNotification', { id, readTime: Date.now() })
    }

    async fetchNotifById(id) {
        return this.operation('findNotificationById', { id })
    }
}

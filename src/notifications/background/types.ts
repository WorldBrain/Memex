import type { Notification } from '../types'
import type { CreateNotification } from 'src/util/notification-types'

export interface RemoteNotificationsInterface {
    storeNotification: (notification: Notification) => Promise<void>
    fetchUnreadCount: () => Promise<number>
    fetchUnreadNotifications: () => Promise<Notification[]>
    fetchReadNotifications: (args: {
        limit: number
        skip: number
    }) => Promise<{ notifications: Notification[]; resultExhausted: boolean }>
    readNotification: (id: string) => Promise<void>
    fetchNotifById: (id: string) => Promise<Notification | null>
    dispatchNotification: (id: string) => Promise<void>
    createNotification: CreateNotification
}

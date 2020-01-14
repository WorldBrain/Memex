import { Notifications } from 'webextension-polyfill-ts'

// Chrome allows some extra notif opts that the standard web ext API doesn't support
export interface NotifOpts extends Notifications.CreateNotificationOptions {
    [chromeKeys: string]: any
    requireInteraction?: boolean
}

export type CreateNotification = (
    notifOptions: Partial<NotifOpts>,
    onClick?: NotificationClickListener,
) => Promise<void>

export type NotificationClickListener = (id: string) => void

export interface NotificationCreator {
    create: CreateNotification
    setupListeners: () => void
}

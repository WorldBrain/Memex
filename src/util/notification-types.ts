import { Notifications } from 'webextension-polyfill-ts/src/generated/notifications'

// Chrome allows some extra notif opts that the standard web ext API doesn't support
export interface NotifOpts extends Notifications.CreateNotificationOptions {
    [chromeKeys: string]: any
}

export type CreateNotificationInterface = (
    notifOptions: Partial<NotifOpts>,
    onClick?: (f: any) => any,
) => Promise<void>

import { NotifOpts } from '../../util/notification-types'

export const REMINDER_NOTIF: Partial<NotifOpts> = {
    title: 'Memex Importer',
    requireInteraction: true,
    message: `If you disabled safe-browsing, don't forget to re-enable`,
}

export const WARN_NOTIF: Partial<NotifOpts> = {
    title: 'Memex Importer',
    requireInteraction: true,
    message: 'Your browser may stop imports suddenly. Find out why',
}

export const WARN_INFO_URL =
    'https://worldbrain.io/import_bug'

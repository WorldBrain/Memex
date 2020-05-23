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
    'https://www.notion.so/worldbrain/Imports-fail-and-freeze-3b8a2a55b7da48288ff1e29f6d43b8db'

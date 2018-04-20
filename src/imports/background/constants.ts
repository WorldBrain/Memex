import { NotifOpts } from '../../util/notifications'

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
    'https://worldbrain.helprace.com/i49-prevent-your-imports-from-stopping-midway'

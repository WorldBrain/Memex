import { browser } from 'webextension-polyfill-ts'
import browserIsChrome from './check-browser'
import {
    CreateNotificationInterface,
    NotifOpts,
} from 'src/util/notification-types'
export const DEF_ICON_URL = '/img/worldbrain-logo-narrow.png'
export const DEF_TYPE = 'basic'

const onClickListeners = new Map<string, (id: string) => void>()

export function setupNotificationClickListener() {
    browser.notifications.onClicked.addListener(id => {
        browser.notifications.clear(id)

        const listener = onClickListeners.get(id)
        listener(id)
        onClickListeners.delete(id) // Manually clean up ref
    })
}

/**
 * Firefox supports only a subset of notif options. If you pass unknowns, it throws Errors.
 * So filter them down if browser is FF, else nah.
 */
function _filterOpts({
    type,
    iconUrl,
    requireInteraction,
    title,
    message,
    ...rest
}: NotifOpts): NotifOpts {
    const opts = { type, iconUrl, requireInteraction, title, message }
    return !browserIsChrome() ? opts : { ...opts, ...rest }
}

const createNotification: CreateNotificationInterface = async (
    notifOptions: Partial<NotifOpts>,
    onClick = f => f,
): Promise<void> => {
    const id = await browser.notifications.create(
        _filterOpts({
            type: DEF_TYPE,
            iconUrl: DEF_ICON_URL,
            requireInteraction: true,
            ...(notifOptions as NotifOpts),
        }),
    )

    onClickListeners.set(id, onClick)

    return
}

export default createNotification

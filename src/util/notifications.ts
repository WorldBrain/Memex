import { browser, Notifications } from 'webextension-polyfill-ts'
export const DEF_ICON_URL = '/img/worldbrain-logo-narrow.png'
export const DEF_TYPE = 'basic'

// Chrome allows some extra notif opts that the standard web ext API doesn't support
export interface NotifOpts extends Notifications.CreateNotificationOptions {
    [chromeKeys: string]: any
}

const onClickListeners = new Map<string, (id: string) => void>()

browser.notifications.onClicked.addListener(id => {
    browser.notifications.clear(id)

    const listener = onClickListeners.get(id)
    listener(id)
    onClickListeners.delete(id) // Manually clean up ref
})

/**
 * Firefox supports only a subset of notif options. If you pass unknowns, it throws Errors.
 * So filter them down if browser is FF, else nah.
 */
function filterOpts({
    type,
    iconUrl,
    title,
    message,
    ...rest
}: NotifOpts): NotifOpts {
    const opts = { type, iconUrl, title, message }
    return browser.runtime.getBrowserInfo != null ? opts : { ...opts, ...rest }
}

async function createNotification(
    notifOptions: Partial<NotifOpts>,
    onClick = f => f,
) {
    const id = await browser.notifications.create(
        filterOpts({
            type: DEF_TYPE,
            iconUrl: DEF_ICON_URL,
            ...(notifOptions as NotifOpts),
        }),
    )

    onClickListeners.set(id, onClick)
}

export default createNotification

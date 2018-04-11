import { browser, Notifications } from 'webextension-polyfill-ts'
import * as noop from 'lodash/fp/noop'

export const DEF_ICON_URL = '/img/worldbrain-logo-narrow.png'
export const DEF_TYPE = 'basic'

const onClickListeners = new Map<string, Function>()

browser.notifications.onClicked.addListener(id => {
    browser.notifications.clear(id)

    const listener = onClickListeners.get(id)
    listener(id)
    onClickListeners.delete(id) // Manually clean up ref
})

async function createNotification(
    notifOptions: Notifications.CreateNotificationOptions,
    onClick = noop as Function,
) {
    const id = await browser.notifications.create({
        type: DEF_TYPE,
        iconUrl: DEF_ICON_URL,
        ...notifOptions,
    })

    onClickListeners.set(id, onClick)
}

export default createNotification

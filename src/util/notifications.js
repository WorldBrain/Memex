export const DEF_ICON_URL = '/img/worldbrain-logo-narrow.png'
export const DEF_TYPE = 'basic'

/**
 * @type {Map<string, Function>}
 */
const onClickListeners = new Map()

browser.notifications.onClicked.addListener(id => {
    browser.notifications.clear(id)

    const listener = onClickListeners.get(id)
    if (typeof listener === 'function') {
        listener(id)
    }
    onClickListeners.delete(id) // Manually clean up ref
})

async function createNotification(notifOptions, onClick) {
    const id = await browser.notifications.create({
        type: DEF_TYPE,
        iconUrl: DEF_ICON_URL,
        ...notifOptions,
    })

    onClickListeners.set(id, onClick)
}

export default createNotification

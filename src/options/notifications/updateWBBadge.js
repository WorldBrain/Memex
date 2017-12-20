import setUnreadCount from '../../util/setUnreadCount.js'

export default async function updateWBBadge() {
    const ba = chrome.browserAction
    ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
    try {
        const res = await setUnreadCount(0)
        if (res > 0) {
            await ba.setBadgeText({ text: '' + res })
        } else {
            await ba.setBadgeText({ text: '' })
        }
    } catch (err) {
        console.err('err', err)
    }
}

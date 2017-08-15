import setUnreadCount from "../../../util/setUnreadCount.js"

export default function updateWBBadge() {
    setUnreadCount(0).then(function(res) {
        var ba = chrome.browserAction
        ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
        if (res > 0) {
            ba.setBadgeText({ text: "" + res })
        } else {
            ba.setBadgeText({ text: "" })
        }

    })
        .catch(function(err) {
            console.log("err")
        })
}

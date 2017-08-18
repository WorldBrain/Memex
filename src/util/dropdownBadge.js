import setUnreadCount from 'src/util/setUnreadCount.js'
import db from "../options/containers/notifications/index-pouch.js"
import PouchDB from "pouchdb"

export default function dropdownBadge(itemToCount) {
    setUnreadCount(0).then(function(res) {
            let unreadCount = document.getElementById('notifs')

            console.log("hello!! readme?", unreadCount)
            if (res === 0) {
                unreadCount.removeAttribute("className")
                unreadCount.innerHTML = ""
            } else {
                unreadCount.setAttribute("className", "badge")
                unreadCount.innerHTML = res
            }
        })
        .catch(function(err) {
            console.log("err", err)
        })
}

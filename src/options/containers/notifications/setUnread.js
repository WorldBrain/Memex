import db from "./index-pouch.js"
import PouchDB from "pouchdb"

// export default function setUnread(itemToCount) {
//     console.log(itemToCount);
//     return itemToCount + 1;
// }

export default function setUnread(itemToCount) {
    console.log(itemToCount)
    db
        .allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0",
        })
        .then(function(response) {
            // handle response

            console.log(response.rows[0])
            const Notifs = response.rows

            // loop through them, if viewed is set to true, add to unread notifs counter

            Notifs.forEach(function(element) {
                console.log(element.doc.viewed)
                if (element.doc.viewed === true) {
                    itemToCount = itemToCount + 1
                }
                console.log("inside foreach", itemToCount)
            })

            console.log("inside then", itemToCount)
        })
        .then(function(response) {
            let ba = chrome.browserAction
            ba.setBadgeBackgroundColor({ color: [62, 185, 149, 128] })
            ba.setBadgeText({ text: "" + itemToCount })
        })
        .catch(function(err) {
            console.log("err")
        })
}

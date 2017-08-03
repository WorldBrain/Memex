import db from "../options/containers/notifications/index-pouch.js"
import PouchDB from "pouchdb"

export default function setUnreadCount(itemToCount) {
    // console.log(itemToCount);
   
    return db
        .allDocs({
            include_docs: true,
            attachments: true,
            startkey: "notif",
            endkey: "notif\ufff0"
        })
        .then(({ rows }) => rows.filter(({ doc }) => doc.viewed).length)
        .catch(function(err) {
            console.log("err", err)
        });
}

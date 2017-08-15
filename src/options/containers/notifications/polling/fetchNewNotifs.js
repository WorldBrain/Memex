import db from "../index-pouch.js"
const PouchDB = require('pouchdb')
// PouchDB.plugin(require('pouchdb-upsert'))
import setUnreadCount from "../../../../util/setUnreadCount.js"
import updateWBBadge from '../updateWBBadge'
import dropdownBadge from "../../../../dropdownBadge.js"

export default function fetchNewNotifs() {
    setInterval(function() {
        let url = "https://codepen.io/jobs.json"
        fetch(url).then(res => res.json()
        ).then(res => {
            let newNotes = res.jobs
            return newNotes
        }).then(newNotes => {
            newNotes.forEach(function(element) {
                db.put({
                    "_id": "notif_" + element.hashid,
                    "MongoId": element.hashid,
                    "title": element.title,
                    "body": element.description,
                    "viewed": false,
                })
            })
        }).then(
            setUnreadCount(0)
        ).then(
            updateWBBadge(0)
        ).then(
            dropdownBadge(0)
        ).catch(err => console.error("err", err))
    }, 1000 * 60 * 60)
}

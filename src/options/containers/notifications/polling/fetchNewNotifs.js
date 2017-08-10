import db from "../index-pouch.js"
const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-upsert'))
import setUnreadCount from "../../../../util/setUnreadCount.js"
import updateWBBadge from '../updateWBBadge'

export default function fetchNewNotifs() {
    setInterval(function() {
        let url = "https://codepen.io/jobs.json"
        fetch(url).then(res => res.json()
        ).then(res => {
            console.log("What's crackin'?")
            console.log(res)
            console.log(res.jobs)
            let newNote = res.jobs[5]
            return newNote
        }).then(newNote => {
            db.putIfNotExists({
                "_id": "notif_" + newNote.hashid,
                "MongoId": newNote.hashid,
                "title": newNote.title,
                "body": newNote.description,
                "viewed": false,
            })
        }).then(
            setUnreadCount(0)
        ).then(
            updateWBBadge(0)
        ).catch(err => console.error("err", err))
    }, 5000)
}

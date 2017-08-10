import db from "../index-pouch.js"
const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-upsert'))
import setUnreadCount from "../../../../util/setUnreadCount.js"


export default function fetchNewNotifs() {
    function getJSON() {
        let url = "https://codepen.io/jobs.json"
        fetch(url).then(res => res.json()
        ).then(res => {
            console.log("What's crackin'?")
            console.log(res)
            console.log(res.jobs)
            let fish = res.jobs[0]
            return fish
        }).then(fish => {
            db.put({
                "_id": "notif_" + fish.hashid,
                "MongoId": fish.hashid,
                "title": fish.title,
                "body": fish.description,
                "viewed": false,
            })
        }).catch(function(err) {
            console.log("err", err)
        })
    }
    // setInterval(, 500)
    getJSON()
    setUnreadCount(0)
}

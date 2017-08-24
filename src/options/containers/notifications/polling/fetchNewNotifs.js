import db from "../index-pouch"
import setUnreadCount from "../../../../util/setUnreadCount"
import updateWBBadge from '../updateWBBadge'

// PouchDB.plugin(require('pouchdb-upsert'))

// export default function fetchNewNotifs() {
//     setInterval(function() {
//         let url = "https://codepen.io/jobs.json"
//         fetch(url).then(res => res.json()
//         ).then(res => {
//             let newNotes = res.jobs
//             return newNotes
//         }).then(newNotes => {
//             newNotes.forEach(function(element) {
//                 db.put({
//                     "_id": "notif_" + element.hashid,
//                     "MongoId": element.hashid,
//                     "title": element.title,
//                     "body": element.description,
//                     "viewed": false,
//                 })
//             })
//         }).then(
//             setUnreadCount(0)
//         ).then(
//             updateWBBadge(0)
//         ).catch(err => console.error("err", err))
//     }, 1000 * 60 * 60)
// }

// var val = await getMeAPromise();
//  val = await getMeAPromise();

export default async function fetchNewNotifs() {
        try {
            let res = await fetch("https://codepen.io/jobs.json")
            let foo = await res.json()
            await console.log("foo", foo)
            let newNotes = await foo.jobs
            await newNotes.forEach(function(element) {
                db.put({
                    "_id": "notif_" + element.hashid,
                    "MongoId": element.hashid,
                    "title": element.title,
                    "body": element.description,
                    "viewed": false,
                })
            })
            await setUnreadCount(0)
            await updateWBBadge(0)
            await console.log("does it work?")
            
        }  
        catch(err) {
            console.log('Error: ', err.message);
        }
    }    

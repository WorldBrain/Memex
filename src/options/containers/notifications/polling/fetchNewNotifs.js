import db from "../../../../../src/pouchdb"
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
            let res = fetch("https://teamtreehouse.com/kate.json")
            let foo = await res.json()
            let newNotes = await foo.badges
            await newNotes.forEach(function(element) {
                db.put({
                    "_id": "notif_9" + element.id,
                    "MongoId": element.id,
                    "title": element.name,
                    "body": element.earned_date,
                    "viewed": false,
                })
            })
            await setUnreadCount(0)
            await updateWBBadge(0)
        }  
        catch(err) {
            console.log('Error: ', err.message);
        }
       
}
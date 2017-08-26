import db from "../../../../pouchdb"
import setUnreadCount from "../../../../util/setUnreadCount"
import updateWBBadge from '../updateWBBadge'
import desktopNotification from './desktopNotification'
import compareArrays from './compareArrays'

export default async function fetchNewNotifs() {
    
        try {
            let unreacCountOne = await setUnreadCount(0)
            let res = await fetch("https://teamtreehouse.com/lisa.json")
            let foo = await res.json()
            let newNotes = await foo.badges

            newNotes.forEach(function(element) {
                db.put({
                    "_id": "notif_" + element.id,
                    "MongoId": element.id,
                    "title": element.name,
                    "body": element.earned_date,
                    "viewed": false,
                })
            })
            await setUnreadCount()
            await updateWBBadge()
            let unreacCountTwo = await setUnreadCount(0)
            console.log("unreacCountTwo", unreacCountTwo)
            console.log("unreacCountOne", unreacCountOne)
            if (unreacCountTwo > unreacCountOne) {
                desktopNotification()
                console.log("new json?")
            }
            await console.log("new json")
        }  
        catch(err) {
            console.log('Error: ', err.message);
        }
       
}
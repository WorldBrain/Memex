import db from '../../../../pouchdb'
import setUnreadCount from '../../../../util/setUnreadCount'
import updateWBBadge from '../updateWBBadge'
import desktopNotification from './desktopNotification'

export default async function fetchNewNotifs() {
    
        try {
            let unreadCountOne = await setUnreadCount(0)
            let res = await fetch('https://salty-fjord-43561.herokuapp.com/api/notifications')
            let newNotes = await res.json()
            // let newNotes = await foo.badges
                        console.log(newNotes)
                        console.log(newNotes[0])
                        console.log("_id", newNotes[0]._id)
            newNotes.forEach(function(element) {
                db.put({
                    '_id': 'notif_' + element._id,
                    'MongoId': element._id,
                    'title': element.title,
                    'body': element.body,
                    'date': element.date,
                    'viewed': false,
                })
            })
            console.log("dones?")
            await setUnreadCount()
            await updateWBBadge()
            let unreadCountTwo = await setUnreadCount(0)
            if (unreadCountTwo > unreadCountOne) {
                desktopNotification()
            }
        } catch(err) {
            console.log('Error: ', err.message);
        }
        
       
}
import db from '../../../../pouchdb'
import setUnreadCount from '../../../../util/setUnreadCount'
import updateWBBadge from '../updateWBBadge'
import desktopNotification from './desktopNotification'

export default async function fetchNewNotifs() {
    
        try {
            let unreadCountOne = await setUnreadCount(0)
            let res = await fetch('https://teamtreehouse.com/lisa.json')
            let foo = await res.json()
            let newNotes = await foo.badges

            newNotes.forEach(function(element) {
                db.put({
                    '_id': `notif_${element.id}`,
                    'MongoId': element.id,
                    'title': element.name,
                    'body': element.earned_date,
                    'viewed': false,
                })
            })
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
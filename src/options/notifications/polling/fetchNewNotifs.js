import db from '../../../pouchdb'
import setUnreadCount from '../../../util/setUnreadCount'
import updateWBBadge from '../updateWBBadge'
import desktopNotification from './desktopNotification'

export default async function fetchNewNotifs() {
    try {
        const unreadCountOne = await setUnreadCount(0)
        const res = await fetch('http://159.65.117.205:3000/api/notifications')
        const installTimestamp = (await browser.storage.local.get(
            'extension_install_time',
        )).extension_install_time

        const newNotes = await res.json()

        newNotes.forEach(function(element) {
            if (installTimestamp <= element.created_at) {
                db.put({
                    _id: 'notifs_' + element._id,
                    MongoId: element._id,
                    title: element.title,
                    body: element.body,
                    date: element.created_at,
                    viewed: false,
                })
            }
        })
        await setUnreadCount()
        await updateWBBadge()
        const unreadCountTwo = await setUnreadCount(0)
        if (unreadCountTwo > unreadCountOne) {
            desktopNotification()
        }
    } catch (err) {
        console.log('Error: ', err.message)
    }
}

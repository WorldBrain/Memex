import db from '../../../pouchdb'
import setUnreadCount from '../../../util/setUnreadCount'
import updateWBBadge from '../updateWBBadge'
import desktopNotification from './desktopNotification'

export default async function fetchNewNotifs() {
    try {
        const unreadCountOne = await setUnreadCount(0)
        const res = await fetch(
            'https://salty-fjord-43561.herokuapp.com/api/notifications',
        )
        const installTimestamp = (await browser.storage.local.get(
            'extension_install_time',
        )).extension_install_time

        const newNotes = await res.json()
        newNotes.forEach(function(element) {
            const dateTimestamp = new Date(element.date).getTime()
            db.put({
                _id: 'notifs_' + element._id,
                MongoId: element._id,
                title: element.title,
                body: element.body,
                date: element.date,
                viewed: installTimestamp > dateTimestamp,
            })
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

import db from '../pouchdb'

export default async function setUnreadCount(itemToCount) {
    try {
        const response = await db.allDocs({
            include_docs: true,
            attachments: true,
            startkey: 'notifs',
            endkey: 'notifs\ufff0',
        })

        const unreadMessages = response.rows.filter(
            notif => notif.doc.viewed === false,
        )
        return unreadMessages.length
    } catch (err) {
        console.log('err', err)
    }
}

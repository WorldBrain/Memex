import db from 'src/search/search-index-new'

export default async function setUnreadCount() {
    try {
        const response = await db.notifications.toArray()

        const unreadMessages = response.filter(notif => notif.viewed === false)
        return unreadMessages.length
    } catch (err) {
        console.log('err', err)
    }
}

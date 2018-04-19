import db from '.'
import { Notification } from './models'

export async function addNotification(notification) {
    console.log(notification)
    return db.transaction('rw', db.tables, async () => {
        const notif = await db.notifications
            .where('id')
            .equals(notification.id)
            .count()

        const notifications = new Notification(notification)
        if (notif === 0) {
            await notifications.save()
        } else if (notification.viewed) {
            await notifications.save()
        }
    })
}

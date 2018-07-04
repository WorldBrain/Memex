import * as notifications from 'src/overview/notifications'

export default async function initNotification() {
    for (let notification of notifications.NEW_NOTIFS) {
        notification = {
            ...notification,
            sentTime: Date.now(),
        }

        await window.notification.storeNotification(notification)
    }
}

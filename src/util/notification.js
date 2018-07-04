import * as notifications from 'src/overview/notifications'
import { remoteFunction } from './webextensionRPC'

const storeNotification = remoteFunction('storeNotification')

export default async function initNotification() {
    for (let notification of notifications.NEW_NOTIFS) {
        notification = {
            ...notification,
            sentTime: Date.now(),
        }

        await storeNotification(notification)
    }
}

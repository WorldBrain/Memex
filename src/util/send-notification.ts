import * as notifications from '../notifications/notifications'
import createNotif from './notifications'
import { remoteFunction } from './webextensionRPC'

const storeNotification = remoteFunction('storeNotification')
const getDriveSize = remoteFunction('getDriveSize')

async function sendNotification(id: string) {
    // get the drive size if there is an error in the request
    const driveSize = id === 'error' ? await getDriveSize() : 1000

    // Set the id for the notification
    const backupError =
        id === 'error'
            ? driveSize.limit && driveSize.usage >= driveSize.limit
                ? 'drive_size_empty'
                : 'backup_error'
            : id

    // Send the corresponding notification
    for (const notification of notifications.NOTIFS) {
        if (notification.id === backupError) {
            dispatchNotification(notification)
        }
    }
}

async function dispatchNotification(notification) {
    if (notification.overview) {
        const newNotification = {
            ...notification.overview,
            id: notification.id,
            deliveredTime: Date.now(),
            sentTime: notifications.releaseTime,
        }
        // Store the notification so that it displays in the inbox
        await storeNotification(newNotification)
    }
    if (notification.system) {
        // Check if the system has to be notified or not
        await createNotif({
            title: notification.system.title,
            message: notification.system.message,
        })
    }
}

export default sendNotification

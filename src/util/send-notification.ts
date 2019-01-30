import * as notifications from '../notifications/notifications'
import createNotif from './notifications'
import checkIfOnline from './check-network'
import { remoteFunction } from './webextensionRPC'

const storeNotification = remoteFunction('storeNotification')
const getDriveSize = remoteFunction('getDriveSize')

async function sendNotification(id: string) {
    // Set the if for the notification
    let backupError = id
    if (id === 'error') {
        if (!!(await checkIfOnline)) {
            backupError = 'backup_error'
        } else {
            // Get the drive size if there is an error in the request
            const driveSize = await getDriveSize()
            if (driveSize.limit && driveSize.usage >= driveSize.limit) {
                backupError = 'drive_size_empty'
            }
        }
    }

    // Send the corresponding notification
    for (const notification of notifications.NOTIFS) {
        if (notification.id === backupError) {
            dispatchNotification(notification)
        }
    }
}

// async function checkIfOnline(): Promise<boolean> {
//     let online = false
//     await fetch('www.google.com', {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     })
//         .catch(err => {online = false})
//         .then((res) => {online = true})
//         .catch(err => {online = false})
//     return online
// }

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

import * as notifications from '../notifications/notifications'
import createNotif from './notifications'
import checkIfOnline from './check-network'
import { remoteFunction } from './webextensionRPC'

const storeNotification = remoteFunction('storeNotification')
const estimateBackupSize = remoteFunction('estimateInitialBackupSize')
const getDriveSize = remoteFunction('getDriveSize')

async function sendNotification(id: string) {
    // Set the id for the notification
    let backupError = id
    if (id === 'error') {
        if (!(await checkIfOnline())) {
            backupError = 'backup_error'
        } else {
            // Get the drive size if there is an error in the request
            const driveSize = (await getDriveSize()).storageQuota
            // Get the backup size and compare to see if its greater than the free
            // space available in the drive
            const backupSize = await estimateBackupSize()
            // driveSize.limit will not exist if the user has an unlimited plan
            // check if user's usage quota has exceeded or reached the limit
            // Check if the data to be uploaded is greater than the size left in drive
            // Play around with this condition to perform checks

            // This is the actual condition to be checked
            // @TODO Uncomment these lines for production
            if (
                (driveSize.limit && driveSize.usage >= driveSize.limit) ||
                backupSize.bytesWithBlobs + backupSize.bytesWithoutBlobs >
                    driveSize.limit - driveSize.usage
            ) {
                // @TODO Comment out the following lines for production
                // Check 1:
                // This check is to see if the backupSize is greater than the size
                // available in google drive. Taking the remaining size on google drive
                // as 1000 bytes
                /* if(
                backupSize.bytesWithBlobs + backupSize.bytesWithoutBlobs > 1000
             ) {
                console.log('Total BackupSize:', backupSize.bytesWithBlobs + backupSize.bytesWithoutBlobs)
            */

                // @TODO Comment out the following lines for production
                // Check 2:
                // This check is to see if the user has no space available in the
                // google drive, Assuming the limit of the drive space to be 1000 bytes
                /*
            if(
                driveSize.usage >= 1000
            ) {
                console.log('Usage:', driveSize.usage)
            */
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

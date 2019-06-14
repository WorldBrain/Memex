import { NotificationInterface } from 'src/util/notification-types'
import { remoteInterface } from 'src/util/webextensionRPC'

interface RemoteFunctionsReg {
    notifications?: NotificationInterface
    // other modules here
}

export const remoteFunctions: RemoteFunctionsReg = {
    notifications: remoteInterface<NotificationInterface>(),
}

export const { notifications } = remoteFunctions

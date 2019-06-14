import { CreateNotificationInterface } from 'src/util/notification-types'

interface RemoteFunctionsReg {
    notifications?: {
        createNotification: CreateNotificationInterface
    }
    // other modules here
}

export const remoteFunctions: RemoteFunctionsReg = {}

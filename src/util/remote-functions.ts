import { remoteInterface } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'

interface RemoteFunctionsReg {
    notifications?: NotificationInterface
    bookmarks?: WithRemoteOptions<BookmarksInterface>
    // other modules here
}

type WithRemoteOptions<T> = { [P in keyof T]: T[P] } & {
    tabId: number
    throwWhenNoResponse: boolean
}

export const remoteFunctions: RemoteFunctionsReg = {
    notifications: remoteInterface<NotificationInterface>(),
    bookmarks: remoteInterface<WithRemoteOptions<BookmarksInterface>>(),
}

export const { notifications, bookmarks } = remoteFunctions

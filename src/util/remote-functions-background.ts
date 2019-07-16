import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'

export interface RemoteFunctionImplementations {
    notifications: NotificationInterface
    bookmarks: BookmarksInterface
}

const remoteFunctions: RemoteFunctionImplementations = {
    notifications: runInBackground<NotificationInterface>(),
    bookmarks: runInBackground<BookmarksInterface>(),
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks

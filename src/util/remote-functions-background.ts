import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'

export interface RemoteFunctionImplementations {
    notifications: NotificationInterface
    bookmarks: BookmarksInterface
    auth: AuthRemoteFunctionsInterface
}

const remoteFunctions: RemoteFunctionImplementations = {
    notifications: runInBackground<NotificationInterface>(),
    bookmarks: runInBackground<BookmarksInterface>(),
    auth: runInBackground<AuthRemoteFunctionsInterface>(),
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks
export const auth = remoteFunctions.auth

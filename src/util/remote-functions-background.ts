import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import {
    AuthRemoteFunctionsInterface,
    SubscriptionRemoteFunctionsInterface,
} from 'src/authentication/background/types'

export interface RemoteFunctionImplementations {
    notifications: NotificationInterface
    bookmarks: BookmarksInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionRemoteFunctionsInterface
}

const remoteFunctions: RemoteFunctionImplementations = {
    notifications: runInBackground<NotificationInterface>(),
    bookmarks: runInBackground<BookmarksInterface>(),
    auth: runInBackground<AuthRemoteFunctionsInterface>(),
    subscription: runInBackground<SubscriptionRemoteFunctionsInterface>(),
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks
// TODO: (CH): Document that this is the main entry point for client calling scripts that want authentication info/actions
export const auth = remoteFunctions.auth
export const subscription = remoteFunctions.subscription

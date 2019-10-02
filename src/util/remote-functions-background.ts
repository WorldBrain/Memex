import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import {
    AuthRemoteFunctionsInterface,
    AuthServerFunctionsInterface,
    SubscriptionServerFunctionsInterface,
} from 'src/authentication/background/types'
type ServerFunctionsInterface = SubscriptionServerFunctionsInterface &
    AuthServerFunctionsInterface

export interface RemoteFunctionImplementations {
    notifications: NotificationInterface
    bookmarks: BookmarksInterface
    auth: AuthRemoteFunctionsInterface
    serverFunctions: ServerFunctionsInterface
}

// See `src/background.ts` for the concrete remote function bindings
// (in setupRemoteFunctionsImplementations and elsewhere)
export const remoteFunctions: RemoteFunctionImplementations = {
    notifications: runInBackground<NotificationInterface>(),
    bookmarks: runInBackground<BookmarksInterface>(),
    auth: runInBackground<AuthRemoteFunctionsInterface>(),
    serverFunctions: runInBackground<ServerFunctionsInterface>(),
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks
export const auth = remoteFunctions.auth
export const serverFunctions = remoteFunctions.serverFunctions

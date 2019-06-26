import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'

export const notifications = runInBackground<NotificationInterface>()
export const bookmarks = runInBackground<BookmarksInterface>()

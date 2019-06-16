import { remoteInterface } from 'src/util/webextensionRPC'
import { NotificationInterface } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'

export const notifications = remoteInterface<NotificationInterface>()
export const bookmarks = remoteInterface<BookmarksInterface>()

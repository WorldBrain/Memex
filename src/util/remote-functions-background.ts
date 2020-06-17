import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationCreator } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { PublicSyncInterface } from 'src/sync/background/types'
import { FeaturesInterface } from 'src/feature-opt-in/background/feature-opt-ins'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
<<<<<<< HEAD
import { RemoteReaderInterface } from 'src/reader/types'
=======
import { PdfRemoteFunctionsInterface } from 'src/pdf-viewer/background/types'
>>>>>>> 1a7c224... Initial reconstruction of pdf-annotation

export interface RemoteFunctionImplementations<
    Role extends 'provider' | 'caller'
> {
    notifications: NotificationCreator
    bookmarks: BookmarksInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    sync: PublicSyncInterface
    features: FeaturesInterface
    tags: RemoteTagsInterface
    collections: RemoteCollectionsInterface
<<<<<<< HEAD
    readable: RemoteReaderInterface
=======
    pdfViewer: PdfRemoteFunctionsInterface
>>>>>>> 1a7c224... Initial reconstruction of pdf-annotation
}

// See `src/background.ts` for the concrete remote function bindings
// (in setupRemoteFunctionsImplementations and elsewhere)
export const remoteFunctions: RemoteFunctionImplementations<'caller'> = {
    notifications: runInBackground<NotificationCreator>(),
    bookmarks: runInBackground<BookmarksInterface>(),
    auth: runInBackground<AuthRemoteFunctionsInterface>(),
    subscription: runInBackground<SubscriptionsService>(),
    sync: runInBackground<PublicSyncInterface>(),
    features: runInBackground<FeaturesInterface>(),
    tags: runInBackground<RemoteTagsInterface>(),
    collections: runInBackground<RemoteCollectionsInterface>(),
<<<<<<< HEAD
    readable: runInBackground<RemoteReaderInterface>(),
=======
    pdfViewer: runInBackground<PdfRemoteFunctionsInterface>(),
>>>>>>> 1a7c224... Initial reconstruction of pdf-annotation
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks
export const auth = remoteFunctions.auth
export const subscription = remoteFunctions.subscription
export const sync = remoteFunctions.sync
export const features = remoteFunctions.features
export const tags = remoteFunctions.tags
export const collections = remoteFunctions.collections
<<<<<<< HEAD
export const readable = remoteFunctions.readable
=======
export const pdfViewer = remoteFunctions.pdfViewer
>>>>>>> 1a7c224... Initial reconstruction of pdf-annotation

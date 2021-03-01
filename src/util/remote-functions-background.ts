import { runInBackground } from 'src/util/webextensionRPC'
import { NotificationCreator } from 'src/util/notification-types'
import { BookmarksInterface } from 'src/bookmarks/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { PublicSyncInterface } from 'src/sync/background/types'
import { FeaturesInterface } from 'src/features/background/feature-opt-ins'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { RemoteReaderInterface } from 'src/reader/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { FeaturesBetaInterface } from 'src/features/background/feature-beta'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { ReadwiseInterface } from 'src/readwise-integration/background/types/remote-interface'
import { PDFInterface } from 'src/pdf/background'

export interface RemoteFunctionImplementations<
    Role extends 'provider' | 'caller'
> {
    notifications: NotificationCreator
    bookmarks: BookmarksInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    sync: PublicSyncInterface
    features: FeaturesInterface
    featuresBeta: FeaturesBetaInterface
    tags: RemoteTagsInterface
    collections: RemoteCollectionsInterface
    copyPaster: RemoteCopyPasterInterface
    readablePageArchives: RemoteReaderInterface
    contentSharing: ContentSharingInterface
    pdf: PDFInterface
}

// See `src/background.ts` for the concrete remote function bindings
// (in setupRemoteFunctionsImplementations and elsewhere)
export const remoteFunctions: RemoteFunctionImplementations<'caller'> = {
    notifications: runInBackground(),
    bookmarks: runInBackground(),
    auth: runInBackground(),
    subscription: runInBackground(),
    sync: runInBackground(),
    features: runInBackground(),
    featuresBeta: runInBackground(),
    tags: runInBackground(),
    collections: runInBackground(),
    copyPaster: runInBackground(),
    readablePageArchives: runInBackground(),
    contentSharing: runInBackground(),
    pdf: runInBackground(),
}

export const notifications = remoteFunctions.notifications
export const bookmarks = remoteFunctions.bookmarks
export const auth = remoteFunctions.auth
export const subscription = remoteFunctions.subscription
export const sync = remoteFunctions.sync
export const features = remoteFunctions.features
export const featuresBeta = remoteFunctions.featuresBeta
export const tags = remoteFunctions.tags
export const collections = remoteFunctions.collections
export const copyPaster = remoteFunctions.copyPaster
export const readable = remoteFunctions.readablePageArchives
export const contentSharing = remoteFunctions.contentSharing
export const annotations = runInBackground<AnnotationInterface<'caller'>>()
export const pdf = remoteFunctions.pdf

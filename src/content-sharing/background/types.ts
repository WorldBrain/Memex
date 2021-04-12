export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'

export interface ContentSharingInterface
    extends ContentSharingServiceInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: {
        listId: number
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    shareAnnotation(options: {
        annotationUrl: string
        queueInteraction?: ContentSharingQueueInteraction
        withoutPageInfo?: boolean
    }): Promise<void>
    shareAnnotations(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    shareAnnotationsToLists(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotationsFromLists(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotation(options: {
        annotationUrl: string
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    ensureRemotePageId(normalizedPageUrl: string): Promise<string>
    getRemoteAnnotationLink(params: {
        annotationUrl: string
    }): Promise<string | null>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    getRemoteListIds(options: {
        localListIds: number[]
    }): Promise<{ [localListId: string]: string | null }>
    getAllRemoteLists(): Promise<
        Array<{ localId: number; remoteId: string; name: string }>
    >
    getRemoteAnnotationIds(params: {
        annotationUrls: string[]
    }): Promise<{ [localId: string]: string | number }>
    getRemoteAnnotationMetadata(params: {
        annotationUrls: string[]
    }): Promise<{
        [localId: string]: {
            localId: string
            remoteId: string | number
            excludeFromLists?: boolean
        }
    }>
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForSync(): Promise<void>
}

export interface ContentSharingEvents {
    pageAddedToSharedList(options: { pageUrl: string }): void
    pageRemovedFromSharedList(options: { pageUrl: string }): void
}

export type ContentSharingQueueInteraction =
    | 'queue-and-await'
    | 'queue-and-return'
    | 'skip-queue'

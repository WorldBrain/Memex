export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'

export interface ContentSharingInterface
    extends ContentSharingServiceInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareAnnotation(options: {
        annotationUrl: string
        remoteAnnotationId?: string
        shareToLists?: boolean
        queueInteraction?: ContentSharingQueueInteraction
        withoutPageInfo?: boolean
    }): Promise<void>
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
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
    unshareAnnotations(options: { annotationUrls: string[] }): Promise<void>
    unshareAnnotation(options: {
        annotationUrl: string
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    ensureRemotePageId(normalizedPageUrl: string): Promise<string>
    getRemoteAnnotationLink(params: {
        annotationUrl: string
    }): Promise<string | null>
    generateRemoteAnnotationId(): Promise<string>
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
    executePendingActions(): Promise<void>
}

export interface ContentSharingEvents {
    pageAddedToSharedList(options: { pageUrl: string }): void
    pageRemovedFromSharedList(options: { pageUrl: string }): void
}

export type ContentSharingQueueInteraction =
    | 'queue-only'
    | 'queue-and-await'
    | 'queue-and-return'
    | 'skip-queue'

export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface ContentSharingInterface
    extends ContentSharingServiceInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareAnnotation(options: {
        annotationUrl: string
        remoteAnnotationId?: string
        shareToLists?: boolean
        queueInteraction?: ContentSharingQueueInteraction
        withoutPageInfo?: boolean
        setBulkShareProtected?: boolean
        skipPrivacyLevelUpdate?: boolean
    }): Promise<{ remoteId: number | string }>
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    shareAnnotationsToLists(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotationsFromLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotations(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
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
    findAnnotationPrivacyLevels(params: {
        annotationUrls: string[]
    }): Promise<{
        [annotationUrl: string]: AnnotationPrivacyLevels
    }>
    setAnnotationPrivacyLevel(params: {
        annotation: string
        privacyLevel: AnnotationPrivacyLevels
    }): Promise<{ remoteId?: number | string }>
    deleteAnnotationPrivacyLevel(params: { annotation: string }): Promise<void>
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

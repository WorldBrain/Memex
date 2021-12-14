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
        existingSharingState?: AnnotationSharingState
    }): Promise<{ remoteId: number | string }>
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
        existingSharingStates?: AnnotationSharingStates
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    shareAnnotationsToAllLists(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
        existingSharingStates?: AnnotationSharingStates
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotationsFromAllLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
        existingSharingStates?: AnnotationSharingStates
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    shareAnnotationToSomeLists(options: {
        annotationUrl: string
        localListIds: number[]
        existingSharingState?: AnnotationSharingState
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationFromSomeLists(options: {
        annotationUrl: string
        localListIds: number[]
        existingSharingState?: AnnotationSharingState
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotations(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
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
    getAnnotationSharingStates(params: {
        annotationUrls: string[]
    }): Promise<AnnotationSharingStates>
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForSync(): Promise<void>
    executePendingActions(): Promise<void>
    getListsForAnnotations(args: {
        annotationUrls: string[]
    }): Promise<{ [annotationUrl: string]: string[] }>
    getListsForAnnotation(annotationUrl: string): Promise<string[]>
    addAnnotationToLists(args: {
        annotationUrl: string
        listIds: number[]
    }): Promise<void>
    removeAnnotationsFromLists(args: {
        annotationUrl: string
        listIds: number[]
    }): Promise<void>
    findAnnotationPrivacyLevels(params: {
        annotationUrls: string[]
    }): Promise<{
        [annotationUrl: string]: AnnotationPrivacyLevels
    }>
    setAnnotationPrivacyLevel(params: {
        annotation: string
        privacyLevel: AnnotationPrivacyLevels
    }): Promise<{
        remoteId?: number | string
        sharingState: AnnotationSharingState
    }>
    deleteAnnotationPrivacyLevel(params: { annotation: string }): Promise<void>
    suggestSharedLists(params: {
        prefix: string
    }): Promise<Array<{ localId: number; name: string }>>
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

export interface AnnotationSharingState {
    remoteId?: string
    privacyLevel: AnnotationPrivacyLevels
    localListIds: number[]
}

export interface AnnotationSharingStates {
    [annotationUrl: string]: AnnotationSharingState
}

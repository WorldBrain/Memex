export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import { ContentSharingServiceInterface } from '@worldbrain/memex-common/lib/content-sharing/service/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface ContentSharingInterface
    extends ContentSharingServiceInterface {
    shareList(options: {
        listId: number
    }): Promise<{
        remoteListId: string
        /** Holds the sharing states of all list member annotations that change to being selectively shared upon list share. */
        annotationSharingStates: AnnotationSharingStates
    }>
    shareAnnotation(options: {
        annotationUrl: string
        remoteAnnotationId?: string
        shareToLists?: boolean
        withoutPageInfo?: boolean
        setBulkShareProtected?: boolean
        skipPrivacyLevelUpdate?: boolean
        queueInteraction?: ContentSharingQueueInteraction
        /** Set this to skip DB potentially unneeded lookups (likely only relevant in ContentSharingBG class). */
        sharingState?: AnnotationSharingState
    }): Promise<{
        remoteId: number | string
        sharingState: AnnotationSharingState
    }>
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    shareAnnotationsToAllLists(options: {
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotationsFromAllLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    shareAnnotationToSomeLists(options: {
        annotationUrl: string
        localListIds: number[]
        protectAnnotation?: boolean
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationFromList(options: {
        annotationUrl: string
        localListId: number
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotations(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotation(options: {
        annotationUrl: string
    }): Promise<{ sharingState: AnnotationSharingState }>
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
    getAnnotationSharingState(params: {
        annotationUrl: string
    }): Promise<AnnotationSharingState>
    getAnnotationSharingStates(params: {
        annotationUrls: string[]
    }): Promise<AnnotationSharingStates>
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
        keepListsIfUnsharing?: boolean
        privacyLevel: AnnotationPrivacyLevels
    }): Promise<{
        remoteId?: number | string
        sharingState: AnnotationSharingState
    }>
    deleteAnnotationShare(params: { annotationUrl: string }): Promise<void>
    deleteAnnotationPrivacyLevel(params: { annotation: string }): Promise<void>
    suggestSharedLists(params: {
        prefix: string
    }): Promise<
        Array<{
            localId: number
            name: string
            remoteId: string
            createdAt: number
        }>
    >
    canWriteToSharedList(params: { localId: number }): Promise<boolean>
    canWriteToSharedListRemoteId(params: { remoteId: string }): Promise<boolean>
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
    hasLink: boolean
    remoteId?: string | number
    privacyLevel: AnnotationPrivacyLevels
    privateListIds: number[]
    sharedListIds: number[]
}

export interface AnnotationSharingStates {
    [annotationUrl: string]: AnnotationSharingState
}

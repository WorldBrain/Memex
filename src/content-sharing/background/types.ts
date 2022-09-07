export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import type {
    ListSharingServiceInterface,
    ListKeysServiceInterface,
    AnnotationSharingServiceInterface,
} from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface ContentSharingInterface
    extends ListSharingServiceInterface,
        Pick<
            ListKeysServiceInterface,
            'deleteKeyLink' | 'getExistingKeyLinksForList'
        >,
        Pick<
            AnnotationSharingServiceInterface,
            | 'shareAnnotation'
            | 'setAnnotationPrivacyLevel'
            | 'getAnnotationSharingState'
            | 'getAnnotationSharingStates'
        > {
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    shareAnnotationsToAllLists(options: {
        annotationUrls: string[]
    }): Promise<{ sharingStates: AnnotationSharingStates }>

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

    shareAnnotationToSomeLists(options: {
        annotationUrl: string
        localListIds: number[]
        protectAnnotation?: boolean
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationFromList(options: {
        annotationUrl: string
        localListId: number
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationsFromAllLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>

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

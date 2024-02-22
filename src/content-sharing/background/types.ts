export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import type {
    SharedListData,
    ListKeysServiceInterface,
    AnnotationSharingServiceInterface,
} from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type {
    RemoteFunction,
    RemoteFunctionRole,
} from 'src/util/webextensionRPC'
import type { ContentSharingBackendInterface } from '@worldbrain/memex-common/lib/content-sharing/backend/types'
import type { SharedListMetadata } from './types'
import { PageList } from 'src/custom-lists/background/types'

export type ListShareResult = Omit<
    SharedListData,
    'annotationSharingStatesPromise'
> & {
    collabKey: string
    annotationLocalToRemoteIdsDict: { [localId: string]: AutoPk }
}

export interface ContentSharingInterface
    extends Pick<
            ListKeysServiceInterface,
            'deleteKeyLink' | 'getExistingKeyLinksForList'
        >,
        Pick<
            AnnotationSharingServiceInterface,
            | 'shareAnnotation'
            | 'setAnnotationPrivacyLevel'
            | 'getAnnotationSharingState'
            | 'getAnnotationSharingStates'
        >,
        Pick<
            ContentSharingBackendInterface,
            | 'createListEmailInvite'
            | 'deleteListEmailInvite'
            | 'acceptListEmailInvite'
            | 'loadListEmailInvites'
        > {
    scheduleListShare(params: {
        localListId: number
        isPrivate?: boolean
        remoteListId?: string
        collabKey?: string
    }): Promise<ListShareResult>
    waitForListShare(params: { localListId: number }): Promise<void>
    deleteListAndAllAssociatedData(params: {
        localListId: number
    }): Promise<void>
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToParentPageLists?: boolean
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
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
    getListShareMetadata(options: {
        localListIds: number[]
    }): Promise<{ [localListId: number]: SharedListMetadata }>
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
        skipListExistenceCheck?: boolean
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationFromList(options: {
        annotationUrl: string
        localListId: number
    }): Promise<{ sharingState: AnnotationSharingState }>
    executePendingActions(): Promise<void>
    findAnnotationPrivacyLevels(params: {
        annotationUrls: string[]
    }): Promise<{
        [annotationUrl: string]: AnnotationPrivacyLevels
    }>
    updateListPrivacy(args: {
        localListId: number
        isPrivate: boolean
    }): Promise<void>
    waitForPageLinkCreation(): Promise<void>
    fetchLocalListDataByRemoteId(args: {
        remoteListId: string
    }): Promise<number>
}

export interface CreatedPageLinkDetails {
    listTitle: string
    localListId: number
    remoteListId: string
    remoteListEntryId: string
    collabKey: string
    pageTitle?: string | null
}

export interface RemoteContentSharingByTabsInterface<
    Role extends RemoteFunctionRole
> {
    schedulePageLinkCreation: RemoteFunction<
        Role,
        {
            fullPageUrl: string
            now?: number
            customPageTitle?: string
            skipPageIndexing?: boolean
        },
        CreatedPageLinkDetails
    >
}

/**
 * These are all old, no-longer-used content sharing BG RPCs.
 * Don't want to delete the implementations just yet, but still want to separate them from the used interface.
 */
export interface __DeprecatedContentSharingInterface {
    shareAnnotationsToAllLists(options: {
        annotationUrls: string[]
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotation(options: {
        annotationUrl: string
    }): Promise<{ sharingState: AnnotationSharingState }>
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
    unshareAnnotationsFromAllLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    getAllRemoteLists(): Promise<
        Array<{ localId: number; remoteId: string; name: string }>
    >
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
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

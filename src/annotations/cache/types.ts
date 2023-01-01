import type TypedEventEmitter from 'typed-emitter'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import type { Anchor } from 'src/highlighting/types'
import type { Annotation } from '../types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface PageAnnotationsCacheEvents {
    updatedPageUrl: (normalizedPageUrl: string) => void
    newListsState: (lists: NormalizedState<UnifiedList>) => void
    newAnnotationsState: (
        annotations: NormalizedState<UnifiedAnnotation>,
    ) => void
    addedAnnotation: (annotation: UnifiedAnnotation) => void
    updatedAnnotation: (annotation: UnifiedAnnotation) => void
    removedAnnotation: (annotation: UnifiedAnnotation) => void
    addedList: (annotation: UnifiedList) => void
    updatedList: (annotation: UnifiedList) => void
    removedList: (annotation: UnifiedList) => void
}

export interface PageAnnotationsCacheInterface {
    setAnnotations: (
        normalizedPageUrl: string,
        annotations: UnifiedAnnotationForCache[],
        opts?: { now?: number },
    ) => { unifiedIds: UnifiedAnnotation['unifiedId'][] }
    setLists: (
        lists: UnifiedListForCache[],
    ) => { unifiedIds: UnifiedList['unifiedId'][] }
    addAnnotation: (
        annotation: UnifiedAnnotationForCache,
        opts?: { now?: number },
    ) => { unifiedId: UnifiedAnnotation['unifiedId'] }
    addList: (
        list: UnifiedListForCache,
    ) => { unifiedId: UnifiedList['unifiedId'] }
    updateAnnotation: (
        updates: Pick<
            UnifiedAnnotation,
            | 'unifiedId'
            | 'remoteId'
            | 'comment'
            | 'unifiedListIds'
            | 'privacyLevel'
        >,
        opts?: {
            updateLastEditedTimestamp?: boolean
            now?: number
        },
    ) => void
    updateList: (
        updates: Pick<UnifiedList, 'unifiedId' | 'description' | 'name'>,
    ) => void
    removeAnnotation: (annotation: Pick<UnifiedAnnotation, 'unifiedId'>) => void
    removeList: (list: Pick<UnifiedList, 'unifiedId'>) => void
    sortLists: (sortingFn?: any) => void
    sortAnnotations: (sortingFn?: AnnotationsSorter) => void

    getAnnotationsArray: () => UnifiedAnnotation[]
    getAnnotationByLocalId: (localId: string) => UnifiedAnnotation | null
    getAnnotationByRemoteId: (remoteId: string) => UnifiedAnnotation | null
    getListByLocalId: (localId: number) => UnifiedList | null
    getListByRemoteId: (remoteId: string) => UnifiedList | null

    readonly isEmpty: boolean
    readonly normalizedPageUrl: string
    readonly events: TypedEventEmitter<PageAnnotationsCacheEvents>
    readonly annotations: NormalizedState<UnifiedAnnotation>
    readonly lists: NormalizedState<UnifiedList>
}

export type UnifiedAnnotation = Pick<
    Annotation & SharedAnnotation,
    'body' | 'comment'
> & {
    // Core annotation data
    unifiedId: string
    localId?: string
    remoteId?: string
    selector?: Anchor
    normalizedPageUrl: string
    lastEdited: number
    createdWhen: number
    creator?: UserReference

    // Misc annotation feature state
    privacyLevel: AnnotationPrivacyLevels
    unifiedListIds: UnifiedList['unifiedId'][]
}

export type UnifiedAnnotationForCache = Omit<
    UnifiedAnnotation,
    'unifiedId' | 'unifiedListIds' | 'createdWhen' | 'lastEdited'
> &
    Partial<
        Pick<UnifiedAnnotation, 'unifiedListIds' | 'createdWhen' | 'lastEdited'>
    > & {
        localListIds: number[]
    }

export interface UnifiedList {
    // Core list data
    unifiedId: string
    localId?: number
    remoteId?: string
    name: string
    description?: string
    creator?: UserReference
    hasRemoteAnnotations: boolean

    // Misc list feature state
    unifiedAnnotationIds: UnifiedAnnotation['unifiedId'][]
}

export type UnifiedListForCache = Omit<UnifiedList, 'unifiedId'>

import type TypedEventEmitter from 'typed-emitter'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import type { Anchor } from 'src/highlighting/types'
import type { Annotation } from '../types'

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
        annotations: Omit<UnifiedAnnotation, 'unifiedId'>[],
    ) => { unifiedIds: UnifiedAnnotation['unifiedId'][] }
    setLists: (
        lists: Omit<UnifiedList, 'unifiedId'>[],
    ) => { unifiedIds: UnifiedList['unifiedId'][] }
    addAnnotation: (
        annotation: Omit<
            UnifiedAnnotation,
            'unifiedId' | 'createdWhen' | 'lastEdited'
        > &
            Partial<Pick<UnifiedAnnotation, 'createdWhen' | 'lastEdited'>>,
        opts?: {
            now?: number
        },
    ) => { unifiedId: UnifiedAnnotation['unifiedId'] }
    addList: (
        list: Omit<UnifiedList, 'unifiedId'>,
    ) => { unifiedId: UnifiedList['unifiedId'] }
    updateAnnotation: (
        updates: Pick<
            UnifiedAnnotation,
            | 'unifiedId'
            | 'comment'
            | 'unifiedListIds'
            | 'isShared'
            | 'isBulkShareProtected'
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

    isEmpty: boolean
    normalizedPageUrl: string
    events: TypedEventEmitter<PageAnnotationsCacheEvents>
    annotations: NormalizedState<UnifiedAnnotation>
    lists: NormalizedState<UnifiedList>
    readonly highlights: UnifiedAnnotation[]
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
    creator: UserReference

    // Misc annotation feature state
    isShared: boolean
    isBulkShareProtected: boolean
    unifiedListIds: UnifiedList['unifiedId'][]
}

export type UnifiedHighlight = UnifiedAnnotation &
    Required<Pick<UnifiedAnnotation, 'body' | 'selector'>>

export interface UnifiedList {
    // Core list data
    unifiedId: string
    localId?: number
    remoteId?: string
    name: string
    description?: string
    creator: UserReference

    // Misc list feature state
    unifiedAnnotationIds: UnifiedAnnotation['unifiedId'][]
}

export interface AnnotationCardInstance {
    instanceId: string
    unifiedAnnotationId: UnifiedAnnotation['unifiedId']
    comment: string
    // add other states
}

export interface ListInstance {
    instanceId: string
    unifiedListId: UnifiedList['unifiedId']
    isOpen: boolean // Whether the list instance in "Spaces" tabs is toggled open
}

export interface AnnotationsCacheState {
    annotationInstances: { [id: string]: AnnotationCardInstance }
    listInstances: { [id: string]: ListInstance }
    annotations: NormalizedState<UnifiedAnnotation>
    lists: NormalizedState<UnifiedList>
}

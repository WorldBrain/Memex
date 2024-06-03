import type TypedEventEmitter from 'typed-emitter'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { SharedAnnotation } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'
import type { Anchor } from 'src/highlighting/types'
import type { Annotation } from '../types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { Orderable } from '@worldbrain/memex-common/lib/utils/item-ordering'
import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'

export interface PageAnnotationsCacheEvents {
    updatedPageData: (
        normalizedPageUrl: string,
        pageListIds: Set<UnifiedList['unifiedId']>,
    ) => void
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
    setHighlightColorDictionary: (colors: HighlightColor[]) => void
    setPageData: (
        normalizedPageUrl: string,
        unifiedListIds: UnifiedList['unifiedId'][],
    ) => void
    getSharedPageListIds: (normalizedPageUrl: string) => string[]
    setAnnotations: (
        annotations: UnifiedAnnotationForCache[],
        opts?: { now?: number; keepExistingData?: boolean },
    ) => { unifiedIds: UnifiedAnnotation['unifiedId'][] }
    setLists: (
        lists: UnifiedListForCache[],
    ) => { unifiedIds: UnifiedList['unifiedId'][] }
    addAnnotation: (
        annotation: UnifiedAnnotationForCache,
        opts?: { now?: number },
    ) => { unifiedId: UnifiedAnnotation['unifiedId'] }
    addList: <T extends UnifiedListType>(
        list: UnifiedListForCache<T>,
        opts?: {
            skipEventEmission?: boolean
        },
    ) => { unifiedId: UnifiedList['unifiedId'] }
    updateAnnotation: (
        updates: Pick<
            UnifiedAnnotation,
            | 'unifiedId'
            | 'remoteId'
            | 'comment'
            | 'body'
            | 'unifiedListIds'
            | 'privacyLevel'
            | 'color'
        >,
        opts?: {
            updateLastEditedTimestamp?: boolean
            keepListsIfUnsharing?: boolean
            forceListUpdate?: boolean
            now?: number
        },
    ) => void
    updateList: (
        updates: Pick<UnifiedList, 'unifiedId'> &
            Partial<
                Pick<
                    UnifiedList<'page-link'>,
                    | 'remoteId'
                    | 'description'
                    | 'name'
                    | 'collabKey'
                    | 'normalizedPageUrl'
                    | 'hasRemoteAnnotationsToLoad'
                    | 'sharedListEntryId'
                    | 'parentUnifiedId'
                    | 'isPrivate'
                    | 'order'
                >
            >,
    ) => void
    removeAnnotation: (
        annotation: Pick<UnifiedAnnotation, 'unifiedId' | 'localId'>,
    ) => void
    removeList: (
        list: Pick<UnifiedList, 'unifiedId'>,
        opts?: {
            skipEventEmission?: boolean
        },
    ) => void
    sortLists: (sortingFn?: any) => void
    sortAnnotations: (sortingFn?: AnnotationsSorter) => void

    getAnnotationsArray: () => UnifiedAnnotation[]
    getAnnotationByLocalId: (localId: string) => UnifiedAnnotation | null
    getAnnotationByRemoteId: (remoteId: string) => UnifiedAnnotation | null
    getListByLocalId: (localId: number) => UnifiedList | null
    getListByRemoteId: (remoteId: string) => UnifiedList | null
    /** Gets all children of the parent, sorted by their order. */
    getListsByParentId: (
        unifiedId: UnifiedList['unifiedId'] | null,
    ) => UnifiedList[]

    readonly isEmpty: boolean
    readonly events: TypedEventEmitter<PageAnnotationsCacheEvents>
    readonly annotations: NormalizedState<UnifiedAnnotation>
    readonly lists: NormalizedState<UnifiedList>
    /**
     * Kept so annotations can "inherit" shared lists from their parent pages upon becoming public.
     * A map of normalized page URLs to their Set of cached list IDs.
     */
    readonly pageListIds: Map<string, Set<UnifiedList['unifiedId']>>
    /**
     * Kept so pages can figure out which page link lists they have.
     */
    readonly normalizedPageUrlsToPageLinkListIds: Map<
        string,
        Set<UnifiedList<'page-link'>['unifiedId']>
    >
}

export type UnifiedAnnotation = Pick<
    Annotation & SharedAnnotation,
    'body' | 'comment' | 'color'
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
    color?: RGBAColor

    // Misc annotation feature state
    privacyLevel: AnnotationPrivacyLevels
    unifiedListIds: UnifiedList['unifiedId'][]
}

export type RGBAColor = {
    r: number
    g: number
    b: number
    a: number
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

interface CoreUnifiedList<T> extends Orderable {
    // Core list data
    unifiedId: string
    localId?: number
    remoteId?: string // TODO: Make this non-optional and update all usages
    collabKey?: string
    name: string
    isPrivate?: boolean
    description?: string
    creator?: UserReference
    hasRemoteAnnotationsToLoad: boolean
    type: T

    /** Denotes whether or not this list was loaded via a web UI page link AND has no locally available data. */
    isForeignList?: boolean

    // Misc list feature state
    unifiedAnnotationIds: UnifiedAnnotation['unifiedId'][]
    /** Set to the `unifiedId` of another list if this list is in a tree and not the root. */
    parentUnifiedId: string | null
    pathUnifiedIds: string[]
    parentLocalId: number | null
    pathLocalIds: number[]
}

export type UnifiedListType = 'user-list' | 'special-list' | 'page-link'

export type UnifiedList<
    T extends UnifiedListType = UnifiedListType
> = T extends 'page-link'
    ? CoreUnifiedList<'page-link'> & {
          normalizedPageUrl: string // Used in the sidebar logic, affording a way to relate page link lists to a given page the sidebar is open for
          remoteId: string // This makes up the first part of the page link
          sharedListEntryId: string // This makes up the last part of the page link
      }
    : CoreUnifiedList<T>

export type UnifiedListForCache<
    T extends UnifiedListType = UnifiedListType
> = Omit<
    UnifiedList<T>,
    | 'order'
    | 'unifiedId'
    | 'parentUnifiedId'
    | 'parentLocalId'
    | 'pathLocalIds'
    | 'pathUnifiedIds'
> & {
    order?: number
    parentLocalId?: number | null
    pathLocalIds?: number[]
}

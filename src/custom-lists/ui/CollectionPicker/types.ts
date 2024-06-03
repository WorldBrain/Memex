import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { Storage } from 'webextension-polyfill'
import type {
    UnifiedList,
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
} from 'src/annotations/cache/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'

type SpacePickerTab = 'user-lists' | 'page-links'

export interface SpacePickerState {
    query: string
    newEntryName: string
    currentTab: SpacePickerTab
    currentUser: UserReference | null
    focusedListId: UnifiedList['unifiedId'] | null
    filteredListIds: UnifiedList['unifiedId'][] | null
    listEntries: NormalizedState<UnifiedList<'user-list'>>
    pageLinkEntries: NormalizedState<UnifiedList<'page-link'>>
    selectedListIds: number[]
    contextMenuPositionX: number
    contextMenuPositionY: number
    contextMenuListId: number | null
    editMenuListId: number | null
    loadState: TaskState
    spaceCreateState: TaskState
    spaceAddRemoveState: TaskState
    spaceWriteError: string | null
    renameListErrorMessage: string | null
    allTabsButtonPressed?: string
    keyboardNavActive: boolean
    addedToAllIds: number[]
}

export type SpacePickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    searchInputChanged: { query: string; skipDebounce?: boolean }
    resultEntryAllPress: {
        entry: UnifiedList
        analyticsBG: AnalyticsCoreInterface
    }
    setSpaceWriteError: { error: string }
    newEntryAllPress: { entry: string; analyticsBG: AnalyticsCoreInterface }
    resultEntryPress: {
        entry: Pick<UnifiedList, 'localId'>
        shouldRerender?: boolean
    }
    resultEntryFocus: { entry: UnifiedList; index: number }
    toggleEntryContextMenu: { listId: number }
    toggleEntryEditMenu: { listId: number }
    onOpenInTabGroupPress: { listId: number }
    openListInWebUI: { unifiedListId: UnifiedList['unifiedId'] }
    updateContextMenuPosition: { x?: number; y?: number }
    setListPrivacy: { listId: number; isPrivate: boolean }
    renameList: { listId: number; name: string }
    deleteList: { listId: number }
    newEntryPress: { entry: string; analyticsBG: AnalyticsCoreInterface }
    switchTab: { tab: SpacePickerTab }
    keyPress: { event: React.KeyboardEvent<HTMLInputElement> }
    onKeyUp: { event: React.KeyboardEvent<HTMLInputElement> }
    focusInput: {}
}>

export interface SpacePickerDependencies {
    /**
     * Set this for annotations space picker to get updates to
     * annotation lists in the case of auto-shared annotations.
     */
    unifiedAnnotationId?: UnifiedAnnotation['unifiedId']
    localStorageAPI: Storage.LocalStorageArea
    shouldHydrateCacheOnInit?: boolean
    annotationsCache: PageAnnotationsCacheInterface
    onSpaceCreate?: (args: {
        localListId: number
        remoteListId: string
        collabKey: string
        name: string
    }) => void
    selectEntry: (
        listId: number,
        options?: { protectAnnotation?: boolean },
    ) => Promise<void | boolean> | void
    unselectEntry: (listId: number) => Promise<void | boolean>
    actOnAllTabs?: (listId: number) => Promise<void>
    /** Called when user keys Enter+Cmd/Ctrl in main text input */
    onSubmit?: () => void | Promise<void>
    initialSelectedListIds?: () => number[] | Promise<number[]>
    dashboardSelectedListId?: number
    children?: any
    filterMode?: boolean
    removeTooltipText?: string
    searchInputPlaceholder?: string
    onListShare?: (ids: { localListId: number; remoteListId: AutoPk }) => void
    onClickOutside?: React.MouseEventHandler
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
    analyticsBG: AnalyticsCoreInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    normalizedPageUrlToFilterPageLinksBy?: string
    width?: string
    autoFocus?: boolean
    context?: string
    closePicker?: (event) => void
    bgScriptBG: RemoteBGScriptInterface<'caller'>
    headlessQuery?: string
    isHeadLess?: boolean
}

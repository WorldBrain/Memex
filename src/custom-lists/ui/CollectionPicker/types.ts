import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { Storage } from 'webextension-polyfill'
import type {
    UnifiedList,
    PageAnnotationsCacheInterface,
} from 'src/annotations/cache/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'

type SpacePickerTab = 'user-lists' | 'page-links'

export interface SpacePickerState {
    query: string
    newEntryName: {
        unifiedId: UnifiedList['unifiedId']
        name: UnifiedList['name']
    }[]
    currentTab: SpacePickerTab
    currentUser: UserReference | null
    focusedListRenderedId: string | null
    filteredListIds: UnifiedList['unifiedId'][] | null
    listEntries: NormalizedState<UnifiedList<'user-list'>>
    pageLinkEntries: NormalizedState<UnifiedList<'page-link'>>
    listIdsShownAsTrees: UnifiedList['unifiedId'][]
    selectedListIds: number[]
    contextMenuListId: number | null
    editMenuListId: number | null
    loadState: TaskState
    spaceCreateState: TaskState
    spaceAddRemoveState: TaskState
    spaceWriteError: string | null
    renameListErrorMessage: string | null
    addedToAllIds: number[]
}

export type SpacePickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    searchInputChanged: { query: string; skipDebounce?: boolean }
    resultEntryAllPress: { entry: UnifiedList }
    setSpaceWriteError: { error: string }
    newEntryAllPress: { entry: string }
    resultEntryPress: {
        entry: Pick<UnifiedList, 'localId'>
        shouldRerender?: boolean
    }
    focusListEntry: { listRenderedId: UnifiedList['unifiedId'] | null }
    toggleEntryContextMenu: { listId: number }
    toggleEntryEditMenu: { listId: number }
    onOpenInTabGroupPress: { listId: number }
    openListInWebUI: { unifiedListId: UnifiedList['unifiedId'] }
    setListPrivacy: { listId: number; isPrivate: boolean }
    renameList: { listId: number; name: string }
    deleteList: { listId: number }
    newEntryPress: { entry: SpacePickerState['newEntryName'] }
    switchTab: { tab: SpacePickerTab }
    keyPress: { event: React.KeyboardEvent<HTMLInputElement> }
    focusInput: {}
    toggleListShownAsTree: { unifiedListId: UnifiedList['unifiedId'] }
}>

export interface SpacePickerDependencies {
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
    initialSelectedListIds?: () => number[] | Promise<number[]>
    filterMode?: boolean
    searchInputPlaceholder?: string
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
    analyticsBG: AnalyticsCoreInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    normalizedPageUrlToFilterPageLinksBy?: string
    width?: string
    context?: string
    closePicker?: (event) => void
    bgScriptBG: RemoteBGScriptInterface<'caller'>
}

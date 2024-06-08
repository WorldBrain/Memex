import type { PickerUpdateHandlerArgs } from 'src/common-ui/GenericPicker/types'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/types'
import type { Props as ActivityIndicatorProps } from 'src/activity-indicator/ui'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type {
    PageAnnotationsCacheInterface,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemotePageActivityIndicatorInterface } from 'src/page-activity-indicator/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'

export interface RibbonSubcomponentProps {
    highlights: RibbonHighlightsProps
    tooltip: RibbonTooltipProps
    sidebar: RibbonSidebarProps
    commentBox: RibbonCommentBoxProps // TODO: (sidebar-refactor) depreciated ,remove when new annotation interface below is complete
    bookmark: RibbonBookmarkProps
    lists: RibbonListsProps
    annotationsCache: PageAnnotationsCacheInterface
    search: RibbonSearchProps
    pausing: RibbonPausingProps
    activityIndicator: ActivityIndicatorProps
    spacesBG: RemoteCollectionsInterface
    authBG: AuthRemoteFunctionsInterface
    pageActivityIndicatorBG: RemotePageActivityIndicatorInterface
    contentSharingBG: ContentSharingInterface
    bgScriptBG: RemoteBGScriptInterface<'caller'>
    onListShare?: SpacePickerDependencies['onListShare']
    hasFeedActivity: boolean
    showConfirmDeletion: boolean
}

export interface RibbonHighlightsProps {
    areHighlightsEnabled: boolean
    handleHighlightsToggle: () => void
}

export interface RibbonTooltipProps {
    isTooltipEnabled: boolean
    handleTooltipToggle: () => void
}

export interface RibbonSidebarProps {
    isSidebarOpen: boolean
    openSidebar: (args: any) => void
    handleSidebarOpenInFocusMode: (listId: UnifiedList['localId']) => void
    sharePage: () => void
    closeSidebar: () => void
    setShowSidebarCommentBox: (value: boolean) => void
    toggleReadingView: () => void
    isWidthLocked: boolean
    isTrial?: boolean
    signupDate?: number
}

export interface RibbonCommentBoxProps {
    tags: string[]
    lists: number[]
    commentText: string
    showCommentBox: boolean
    isCommentSaved: boolean
    saveComment: (shouldShare: boolean, isProtected?: boolean) => Promise<void>
    cancelComment: () => void
    setShowCommentBox: (value: boolean) => void
    updateCommentBoxTags: (tags: string[]) => void
    updateCommentBoxLists: (lists: number[]) => void
    changeComment: (text: string) => void
}

export interface RibbonBookmarkProps {
    isBookmarked: boolean
    loadState: TaskState
    writeError: string | null
    toggleBookmark: () => void
    lastBookmarkTimestamp: number
}

export interface ListEntryArgs {
    listId: number
    pageUrl: string
}

export interface RibbonListsProps {
    pageListIds: number[]
    showListsPicker: boolean
    updateLists: (
        args: PickerUpdateHandlerArgs<number> & { skipPageIndexing?: boolean },
    ) => Promise<void>
    listAllTabs: (value: number) => Promise<void>
    setShowListsPicker: (value: boolean) => void
    fetchInitialListSelections: () => Promise<number[]>
    selectEntry: SpacePickerDependencies['selectEntry']
    unselectEntry: SpacePickerDependencies['unselectEntry']
    onSpaceCreate: SpacePickerDependencies['onSpaceCreate']
}

export interface RibbonSearchProps {
    showSearchBox: boolean
    searchValue: string
    setShowSearchBox: (value: boolean) => void
    setSearchValue: (value: string) => void
}

export interface RibbonPausingProps {
    isPaused: boolean
    handlePauseToggle: () => void
}

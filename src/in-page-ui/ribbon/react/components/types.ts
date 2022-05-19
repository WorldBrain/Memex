import type {
    PickerUpdateHandler,
    PickerUpdateHandlerArgs,
} from 'src/common-ui/GenericPicker/types'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import type { Props as ActivityIndicatorProps } from 'src/activity-indicator/ui'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'

export interface RibbonSubcomponentProps {
    highlights: RibbonHighlightsProps
    tooltip: RibbonTooltipProps
    sidebar: RibbonSidebarProps
    commentBox: RibbonCommentBoxProps // TODO: (sidebar-refactor) depreciated ,remove when new annotation interface below is complete
    bookmark: RibbonBookmarkProps
    tagging: RibbonTaggingProps
    lists: RibbonListsProps
    search: RibbonSearchProps
    pausing: RibbonPausingProps
    activityIndicator: ActivityIndicatorProps
    spacesBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
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
    closeSidebar: () => void
    setShowSidebarCommentBox: (value: boolean) => void
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
    toggleBookmark: () => void
}

export interface RibbonTaggingProps {
    tags: string[]
    pageHasTags: boolean
    showTagsPicker: boolean
    shouldShowTagsUIs: boolean
    updateTags: PickerUpdateHandler
    tagAllTabs: (value: string) => Promise<void>
    setShowTagsPicker: (value: boolean) => void
    loadDefaultSuggestions: () => Promise<string[]>
    queryEntries: (query: string) => Promise<string[]>
    fetchInitialTagSelections: () => Promise<string[]>
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
    createNewEntry: SpacePickerDependencies['createNewEntry']
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

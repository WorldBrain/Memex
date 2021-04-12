import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

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
    commentText: string
    showCommentBox: boolean
    isCommentSaved: boolean
    saveComment: () => Promise<void>
    cancelComment: () => void
    setShowCommentBox: (value: boolean) => void
    updateCommentBoxTags: (tags: string[]) => void
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
    pageBelongsToList: boolean
    showListsPicker: boolean
    updateLists: PickerUpdateHandler
    listAllTabs: (value: string) => Promise<void>
    setShowListsPicker: (value: boolean) => void
    fetchInitialListSelections: () => Promise<string[]>
    loadDefaultSuggestions: () => Promise<string[]>
    queryEntries: (query: string) => Promise<string[]>
    loadRemoteListNames: () => Promise<string[]>
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

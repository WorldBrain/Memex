import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

export interface RibbonSubcomponentProps {
    highlights: RibbonHighlightsProps
    tooltip: RibbonTooltipProps
    sidebar: RibbonSidebarProps
    commentBox: RibbonCommentBoxProps
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

export interface RibbonCommentBoxProps extends CommonTaggingProps {
    commentText: string
    showCommentBox: boolean
    isCommentSaved: boolean
    isCommentBookmarked: boolean
    isAnnotation: boolean
    isTagInputActive: boolean
    showTagsPicker: boolean
    handleCommentTextChange: (comment: string) => void
    saveComment: () => void
    cancelComment: () => void
    toggleCommentBookmark: () => void
    toggleTagPicker: () => void
    setShowCommentBox: (value: boolean) => void
    updateCommentTags: PickerUpdateHandler
}

export interface RibbonBookmarkProps {
    isBookmarked: boolean
    toggleBookmark: () => void
}

export interface RibbonTaggingProps extends CommonTaggingProps {
    showTagsPicker: boolean
    setShowTagsPicker: (value: boolean) => void
    updateTags: PickerUpdateHandler
}

export interface CommonTaggingProps {
    tags: string[]
    tagSuggestions: string[]
    initTagSuggestions: string[]
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => Promise<string[]>
}

export interface ListEntryArgs {
    listId: number
    pageUrl: string
}

export interface RibbonListsProps {
    initialLists: []
    initialListSuggestions: []
    showListsPicker: boolean
    updateLists: PickerUpdateHandler
    setShowListsPicker: (value: boolean) => void
    queryListSuggestions: (query: string) => Promise<string[]>
    fetchInitialListSuggestions: () => Promise<string[]>
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

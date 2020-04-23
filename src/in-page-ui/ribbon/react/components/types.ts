import { PageList } from 'src/custom-lists/background/types'

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

export interface RibbonCommentBoxProps {
    commentText: string
    showCommentBox: boolean
    isCommentSaved: boolean
    setShowCommentBox: (value: boolean) => void
}

export interface RibbonBookmarkProps {
    isBookmarked: boolean
    handleBookmarkToggle: () => void
}

export interface RibbonTaggingProps {
    tags: string[]
    initTagSuggs: string[]
    showTagsPicker: boolean
    onTagAdd: (tag: string) => void
    onTagDel: (tag: string) => void
    setShowTagsPicker: (value: boolean) => void
}

export interface RibbonListsProps {
    collections: []
    initCollSuggs: []
    showCollectionsPicker: boolean
    onCollectionAdd: (collection: PageList) => void
    onCollectionDel: (collection: PageList) => void
    setShowCollectionsPicker: (value: boolean) => void
}

export interface RibbonSearchProps {
    showSearchBox: boolean
    searchValue: string
    setShowSearchBox: (value: boolean) => void
    setSearchValue: (value: string) => void
}

export interface RibbonPausingProps {
    isPaused: false
    handlePauseToggle: () => void
}

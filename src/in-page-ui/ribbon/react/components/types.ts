import { PageList } from 'src/custom-lists/background/types'
import { Anchor } from 'src/highlighting/types'

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
    toggleBookmark: () => void
    toggleTagPicker: () => void
    setShowCommentBox: (value: boolean) => void
}

export interface RibbonBookmarkProps {
    isBookmarked: boolean
    handleBookmarkToggle: () => void
}

export interface RibbonTaggingProps extends CommonTaggingProps {
    showTagsPicker: boolean
    setShowTagsPicker: (value: boolean) => void
}

export interface CommonTaggingProps {
    tags: string[]
    initTagSuggestions: string[]
    tagSuggestions: string[]
    addTag: (event: { tag: string; context: 'commentBox' | 'tagging' }) => void
    deleteTag: (event: {
        tag: string
        context: 'commentBox' | 'tagging'
    }) => void
}

export interface RibbonListsProps {
    initialLists: []
    initialListSuggestions: []
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
    isPaused: boolean
    handlePauseToggle: () => void
}

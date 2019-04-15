/**
 * This file contains any type declarations pertinent to ribbon.
 * Default export is the Ribbon's state's type declaration.
 */

export default interface State {
    isPageFullScreen: boolean
    isExpanded: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
    showCommentBox: boolean
    showSearchBox: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    showHighlights?: boolean
    searchValue: string
}

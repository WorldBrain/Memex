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

export interface RibbonInteractionsInterface {
    insertRibbon: ({ override, ...args }?: { override?: boolean } | any) => any
    removeRibbon: ({ override }?: { override?: boolean }) => any
    insertOrRemoveRibbon: () => any
    updateRibbon: () => any
}

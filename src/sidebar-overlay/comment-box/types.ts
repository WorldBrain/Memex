/**
 * This file contains any type declarations pertinent to the Comment Box.
 * Default export is the Comment Box's state's type declaration.
 */

export default interface State {
    commentInput: string
    textareaRows: number
    isHidden: boolean
    tagInput: boolean
    tags: any[]
    displayHighlightTruncated: boolean
    anchor: any
    focusCommentBox: boolean
}

/**
 * This file contains any type declarations pertinent to the Comment Box.
 * Default export is the Comment Box's state's type declaration.
 */

import { Anchor } from '../../direct-linking/content_script/interactions'

export default interface State {
    /** Denotes whether or not the sidebar should show the comment box. */
    showCommentBox: boolean
    /** Highlighted anchor that is relevant for the current comment. */
    anchor: Anchor | undefined
    /** Actual text value for the comment. */
    commentText: string
    /** Holds the tags associated with the current comment. */
    tags: string[]
    /** Holds the initial tag suggestions to display for the user search. */
    initTagSuggestions: string[]
}

/**
 * This file contains any type declarations pertinent to the sidebar.
 * Default export is the Sidebar's state's type declaration.
 */

import { State as CommentBoxState } from '../comment-box'

export interface Page {
    url: string | null
    title: string | null
}

// TODO: Update this once annotation search's backend is complete.
export interface Annotation {
    /** Unique URL for this annot. Used as more of an ID; probably not for display. */
    url: string
    /** URL for display. */
    pageUrl: string
    /** Defined for annotations with highlighted text. */
    body?: string
    /** Defined for annotations with a user comment. */
    comment?: string
    createdWhen: Date
    tags: string[]
    isBookmarked: boolean
}

export default interface State {
    /** Denotes whether the sidebar is open or not. */
    isOpen: boolean
    /** Information about the page to pass to the storage. */
    page: Page
    /** Annotations that this page has. */
    annotations: Annotation[]
    /** State for the comment box. */
    commentBox: CommentBoxState
}

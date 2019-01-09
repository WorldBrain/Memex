/**
 * This file contains any type declarations pertinent to the sidebar.
 * Default export is the Sidebar's state's type declaration.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { State as CommentBoxState } from './comment-box'
import AnnotationsManager from './annotations-manager'

export interface Page {
    url: string | null
    title: string | null
}

// TODO: Update this once annotation search's backend is complete.
export interface Annotation {
    /** Unique URL for this annotation. Used as more of an ID; probably not for display. */
    url: string
    /** URL for display. */
    pageUrl: string
    /** Defined for annotations with highlighted text. */
    body?: string
    /** Defined for annotations with a user comment. */
    comment?: string
    createdWhen: Date
    lastEdited: Date | null
    tags: string[]
    isBookmarked: boolean
}

export default interface State {
    /** An object that is responsible for interacting with appropriate scripts
     * for annotations.
     */
    annotationsManager: AnnotationsManager
    /** Denotes whether the sidebar is open or not. */
    isOpen: boolean
    /** Denotes whether the sidebar is loading annotations or not. */
    isLoading: boolean
    /** Information about the page to pass to the storage. */
    page: Page
    /** Annotations that this page has. */
    annotations: Annotation[]
    /** State for the comment box. */
    commentBox: CommentBoxState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, State, void, any>

/**
 * Allows omission of a key in T.
 * Taken from: https://stackoverflow.com/a/48216010
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<State, void, any>,
    ownProps: OwnProps,
) => DispatchProps

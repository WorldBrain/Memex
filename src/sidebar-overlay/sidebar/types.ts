/*
 * This file contains any type declarations pertinent to the sidebar.
 * Default export is the Sidebar's state's type declaration.
 */

import { State as CommentBoxState } from '../comment-box'
import AnnotationsManager from '../../annotations/annotations-manager'
import { Annotation } from 'src/annotations/types'

export interface Page {
    url: string | null
    title: string | null
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
    /** Denotes whether or not more annotations are available. */
    resultsExhausted: boolean
    /** Information about the page to pass to the storage. */
    page: Page
    /** Annotations that this page has. */
    annotations: Annotation[]
    /** URL for the currently active annotation. */
    activeAnnotationUrl: string | null
    /** URL for the currently hovered annotation. */
    hoverAnnotationUrl: string | null
    /** State for the comment box. */
    commentBox: CommentBoxState
    /** Denotes whether to to show the congrats message during onboarding or not. */
    showCongratsMessage: boolean
    /** Represents the latest page of annotations being fetched. */
    currentResultPage: number
    /** Denotes the type of search performed */
    searchType: 'notes' | 'page' | 'social'
    /** Denotes whether the search is on current page or all pages */
    pageType: 'page' | 'all'
    isSocialPost: boolean
}

export interface KeyboardActions {
    openToCollections: boolean
    openToBookmark: boolean
    openToComment: boolean
    openToTags: boolean
}

/**
 * This file contains any type declarations pertinent to the sidebar.
 * Default export is the Sidebar's state's type declaration.
 */

import { State as CommentBoxState } from '../comment-box'

export default interface State {
    isOpen: boolean
    commentBox: CommentBoxState
}

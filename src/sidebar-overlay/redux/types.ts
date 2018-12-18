import { State as SidebarState } from './reducer'
import { State as CommentBoxState } from '../comment-box/reducer'

export interface RootState {
    sidebar: SidebarState
    reducer: CommentBoxState
}

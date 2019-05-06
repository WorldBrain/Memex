import { ThunkAction } from 'redux-thunk'

import { State as TagsBtnState } from 'src/popup/tags-button/reducer'
import { State as CollectionsBtnState } from 'src/popup/collections-button/reducer'
import { State as SidebarState } from 'src/sidebar-overlay/sidebar'

export default interface RootState {
    tagsBtn: TagsBtnState
    collectionsBtn: CollectionsBtnState
    sidebar: SidebarState
}

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

export interface User {
    id?: string
    name?: string
    username: string
    isVerified?: boolean
    profilePicUrl?: string
    profilePic?: any
    type: string
}

export interface Tweet {
    id: string
    userId: string
    createdAt: number
    text: string
    url: string
    hashtags?: Array<string>
    createdWhen?: Date

    user?: User

    _text_terms?: string[]
}

export interface SocialPage extends Tweet {
    hasBookmark?: boolean
}

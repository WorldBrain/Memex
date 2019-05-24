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
    id?: number
    name: string
    username: string
    serviceId?: string
    isVerified?: boolean
    profilePicUrl?: string
    profilePic?: any
    type: string
}

export interface Tweet {
    id?: number
    userId: number
    text: string
    hashtags: Array<string>
    createdWhen: Date | number
    createdAt: Date
    serviceId?: string
    user?: User
    _text_terms?: string[]
}

export interface TweetUrl {
    url: string
}

export interface TweetUrlProps {
    username: string
    serviceId: string
}

export interface SocialPage extends Tweet {
    hasBookmark?: boolean
    annotsCount?: number
}

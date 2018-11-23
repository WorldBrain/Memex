import { ThunkAction } from 'redux-thunk'

import { State as BlacklistBtnState } from './blacklist-button/reducer'
import { State as BookmarkBtnState } from './bookmark-button/reducer'
import { State as TagsBtnState } from './tags-button/reducer'
import { State as CollectionsBtnState } from './collections-button/reducer'
import { State as PauseBtnState } from './pause-button/reducer'
import { State as NotifsBtnState } from './notif-button/reducer'
import { State as InPageSwitchesState } from './in-page-switches/reducer'
import { State as PopupState } from './reducer'

export interface RootState {
    blacklistBtn: BlacklistBtnState
    bookmarkBtn: BookmarkBtnState
    tagsBtn: TagsBtnState
    collectionsBtn: CollectionsBtnState
    pauseBtn: PauseBtnState
    inPageSwitches: InPageSwitchesState
    notifsBtn: NotifsBtnState
    popup: PopupState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

/**
 * This file contains any type declarations pertinent to RibbonSidebarController
 * Default export is the component's state's type declaration, which also
 * happens to be the Root State for the entire 'sidebar-overlay' component.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { State as RibbonState } from './ribbon'
import { State as SidebarState } from 'src/sidebar-common'
import { State as BlacklistBtnState } from 'src/popup/blacklist-button/reducer'
import { State as BookmarkBtnState } from 'src/popup/bookmark-button/reducer'
import { State as TagsBtnState } from 'src/popup/tags-button/reducer'
import { State as CollectionsBtnState } from 'src/popup/collections-button/reducer'
import { State as PauseBtnState } from 'src/popup/pause-button/reducer'
import { State as NotifsBtnState } from 'src/popup/notif-button/reducer'
import { State as SidebarBtnState } from 'src/popup/sidebar-button/reducer'
import { State as TooltipBtnState } from 'src/popup/tooltip-button/reducer'
import { State as PopupState } from 'src/popup/reducer'

export default interface RootState {
    ribbon: RibbonState
    sidebar: SidebarState
    blacklistBtn: BlacklistBtnState
    bookmarkBtn: BookmarkBtnState
    tagsBtn: TagsBtnState
    collectionsBtn: CollectionsBtnState
    pauseBtn: PauseBtnState
    sidebarBtn: SidebarBtnState
    tooltipBtn: TooltipBtnState
    notifsBtn: NotifsBtnState
    popup: PopupState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<RootState, void, any>,
    ownProps: OwnProps,
) => DispatchProps

export interface OpenSidebarArgs {
    activeUrl?: string
    openToTags?: boolean
    openToComment?: boolean
    openToCollections?: boolean
}

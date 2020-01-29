/**
 * This file contains any type declarations pertinent to RibbonSidebarController
 * Default export is the component's state's type declaration, which also
 * happens to be the Root State for the entire 'sidebar-overlay' component.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { State as RibbonState } from './ribbon'
import { State as SidebarState } from './sidebar'
import { State as BookmarkBtnState } from 'src/popup/bookmark-button/reducer'
import { State as TagsBtnState } from 'src/popup/tags-button/reducer'
import { State as CollectionsBtnState } from 'src/popup/collections-button/reducer'
import { State as PauseBtnState } from 'src/popup/pause-button/reducer'
import { State as PopupState } from 'src/popup/reducer'
import { State as SearchBarState } from 'src/overview/search-bar/reducer'
import { RootState as searchFiltersState } from 'src/search-filters/types'
import { State as ResultsState } from 'src/overview/results/reducer'
import { State as deleteConfModalState } from 'src/overview/delete-confirm-modal/reducer'
import { State as CustomListsState } from 'src/custom-lists/types'
import * as React from 'react'
import { HighlightInteractionInterface } from 'src/highlighting/types'

export default interface RootState {
    ribbon: RibbonState
    sidebar: SidebarState
    bookmarkBtn: BookmarkBtnState
    tagsBtn: TagsBtnState
    collectionsBtn: CollectionsBtnState
    pauseBtn: PauseBtnState
    popup: PopupState
    searchBar: SearchBarState
    searchFilters: searchFiltersState
    results: ResultsState
    customLists: CustomListsState
    deleteConfModal: deleteConfModalState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

/**
 * Allows omission of a key in T.
 * Taken from: https://stackoverflow.com/a/48216010
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<RootState, void, any>,
    ownProps: OwnProps,
) => DispatchProps

export interface OpenSidebarArgs {
    activeUrl?: string
}

export interface SidebarContextInterface {
    highlighter: HighlightInteractionInterface
}

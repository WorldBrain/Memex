/**
 * This file contains any type declarations pertinent to RibbonSidebarController
 * Default export is the component's state's type declaration, which also
 * happens to be the Root State for the entire 'sidebar-overlay' component.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { State as RibbonState } from './ribbon'
import { State as SidebarState } from '../sidebar-common'

export default interface RootState {
    ribbon: RibbonState
    sidebar: SidebarState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<RootState, void, any>,
    ownProps: OwnProps,
) => DispatchProps

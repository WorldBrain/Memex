/**
 * This file contains any type declarations pertinent to sidebar-overlay.
 * Default export is the component's state's type declaration.
 */

import { ThunkAction } from 'redux-thunk'

import { State as RibbonState } from './ribbon'

export default interface RootState {
    ribbon: RibbonState
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

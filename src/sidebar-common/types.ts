/**
 * This file contains "helper" type declarations that are useful for the entire
 * directory.
 */

import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { State } from './sidebar'

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, State, void, any>

/**
 * Allows omission of a key in T.
 * Taken from: https://stackoverflow.com/a/48216010
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<State, void, any>,
    ownProps: OwnProps,
) => DispatchProps

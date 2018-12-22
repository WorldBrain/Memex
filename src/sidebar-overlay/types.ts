import { ThunkAction, ThunkDispatch } from 'redux-thunk'

import { RootState } from './ribbon-sidebar-controller'

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void

export type Thunk<R = void> = ThunkAction<R, RootState, void, any>

export type MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch: ThunkDispatch<RootState, void, any>,
    ownProps: OwnProps,
) => DispatchProps

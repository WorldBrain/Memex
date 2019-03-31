import { ThunkDispatch } from 'redux-thunk'

/**
 * Type interface for MapDispatchToProps using Thunks in actions.
 */
export type MapDispatchToProps<DispatchProps, OwnProps, RootState> = (
    dispatch: ThunkDispatch<RootState, void, any>,
    ownProps: OwnProps,
) => DispatchProps

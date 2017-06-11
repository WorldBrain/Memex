// Wrap an action creator to dispatch extra actions when it starts and when it
// completes (or fails).

// Inspired by: http://engineering.blogfoster.com/managing-complexity-in-redux-higher-order-reducers-and-async-state/

import { createAction } from 'redux-act'


export default function asyncActionCreator({
    // actionCreator is assumed to create a thunk that returns a promise.
    actionCreator,
    pending = createAction('pending'),
    complete = createAction('complete'),
    error = createAction('error'),
}) {
    const newActionCreator = (...args) => {
        return async dispatch => {
            let value
            const action = actionCreator(...args)
            dispatch(pending({action, args}))
            try {
                value = await dispatch(action)
            } catch (err) {
                dispatch(error({error: err, action, args}))
            }
            dispatch(complete({value, action, args}))
        }
    }
    newActionCreator.pending = pending
    newActionCreator.complete = complete
    newActionCreator.error = error
    return newActionCreator
}

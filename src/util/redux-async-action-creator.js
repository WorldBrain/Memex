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
    // exclusive: lets multiple invocations exclude each other.
    // false (default): each action runs independently.
    // true: ignore any calls when this action is already running.
    // 'takeLast': run actions normally, but cancel/ignore any previous ones.
    exclusive = false,
}) {
    let runningPromises = []

    const newActionCreator = (...args) => {
        return async dispatch => {
            if (runningPromises.length && exclusive === true) return
            if (runningPromises.length && exclusive === 'takeLast') {
                // Cancel all running promises. Or well, we just ignore their
                // results as JS Promises cannot be cancelled.
                runningPromises.forEach(promise => {
                    runningPromises = []
                })
            }

            // Run the actionCreator
            const action = actionCreator(...args)
            dispatch(pending({action, args}))

            const promise = dispatch(action)

            runningPromises.push(promise)

            let finalAction
            try {
                const value = await promise
                finalAction = complete({value, action, args})
            } catch (err) {
                finalAction = error({error: err, action, args})
            }
            if (runningPromises.includes(promise)) {
                dispatch(finalAction)
                runningPromises = runningPromises.filter(v => (v !== promise))
            } // (else it was supposed to be cancelled, so we ignore the outcome)
        }
    }
    newActionCreator.pending = pending
    newActionCreator.complete = complete
    newActionCreator.error = error
    return newActionCreator
}

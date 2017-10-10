// Wrap an action creator to dispatch extra actions when it starts and when it
// completes (or fails).

// Inspired by: http://engineering.blogfoster.com/managing-complexity-in-redux-higher-order-reducers-and-async-state/

import { createAction } from 'redux-act'

export default function asyncActionCreator(
    // actionCreator is assumed to create a thunk that returns a promise.
    actionCreator,
    {
        pending = createAction('pending'),
        finished = createAction('finished'),
        complete = createAction('complete'),
        error = createAction('error'),
        cancelled = createAction('cancelled'),
        // exclusive: lets multiple invocations exclude each other.
        // false (default): each action runs independently.
        // true: ignore any calls when this action is already running.
        // 'takeLast': run every action after cancelling any uncompleted ones.
        exclusive = false,
    } = {},
) {
    // We keep a list of all running instances of the action, to be able to
    // check if any are pending or cancel them all.
    let runningTransactions = []

    function isPending() {
        return runningTransactions.length > 0
    }

    function cancelAll() {
        runningTransactions.forEach(transaction => {
            transaction.cancel()
        })
        runningTransactions = []
    }

    const newActionCreator = (...args) => {
        return async dispatch => {
            if (isPending() && exclusive === true) return
            if (isPending() && exclusive === 'takeLast') {
                cancelAll()
            }

            // Run the actionCreator
            const action = actionCreator(...args)
            dispatch(pending({ action, args }))

            const removeFromTransactionList = () => {
                runningTransactions = runningTransactions.filter(
                    v => v !== transaction,
                )
            }

            // Cancels this transaction. Put more accurately, we just ignore its
            // results, because a Javascript Promise cannot really be cancelled.
            const cancel = () => {
                cancelled && dispatch(cancelled({ action, args }))
                finished &&
                    dispatch(
                        finished({
                            value: undefined,
                            error: undefined,
                            cancelled: true,
                        }),
                    )
                removeFromTransactionList()
            }

            const transaction = {
                cancel,
            }
            runningTransactions.push(transaction)

            let value
            let err
            try {
                const promise = dispatch(action)
                value = await promise
            } catch (err_) {
                err = err_
            }
            // If the transaction was not cancelled, dispatch some actions.
            if (runningTransactions.includes(transaction)) {
                if (err) {
                    error && dispatch(error({ error: err }))
                } else {
                    complete && dispatch(complete({ value }))
                }
                finished &&
                    dispatch(
                        finished({
                            value,
                            error: err,
                            cancelled: false,
                        }),
                    )
                removeFromTransactionList()
            }
        }
    }

    newActionCreator.pending = pending
    newActionCreator.finished = finished
    newActionCreator.complete = complete
    newActionCreator.error = error
    newActionCreator.cancelled = cancelled
    newActionCreator.isPending = isPending
    newActionCreator.cancelAll = cancelAll
    return newActionCreator
}

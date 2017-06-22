// Create a promise that resolves when `resolve.event` occurs, or rejects when
// `reject.event` occurs.
//
// Either argument may also be an array to specify multiple events; whichever
// event occurs first resolves/rejects the promise. Either could also be
// omitted, but then the promise can never resolve/reject (respectively).
//
// Arguments:
// - resolve: object with options (or array of objects) for resolving.
// - reject: object with options (or array of objects) for rejecting.
//
// The options objects can have the following properties:
// - event (required):
//     The event to listen to. Could be anything with an `addListener` method.
// - filter (optional):
//     Supply a predicate function to decide for each event whether to
//     resolve/reject or to ignore it. The function gets passed the event
//     parameters, as if it was an event handler.
// - value (optional, only for `resolve`):
//     The value to resolve with when resolving for this event; or a function
//     that provides this value (which gets passed the event parameters).
// - reason (optional, only for `reject`):
//     Like `value`, but for specifying the reason to reject with.

export default function eventToPromise({
    resolve: resolveOpts,
    reject: rejectOpts,
}) {
    // Make an array if we got passed a single options object (or none at all).
    resolveOpts = castToArray(resolveOpts)
    rejectOpts = castToArray(rejectOpts)

    return new Promise(function (resolve, reject) {
        // A list of {event, listener} pairs, populated below.
        const listeners = []

        // To clean up our listeners when either resolving or rejecting.
        function removeListeners() {
            listeners.forEach(listener => {
                listener.event.removeListener(listener.listener)
            })
        }

        // For each of the events in resolveOpts, create an event listener
        // function that resolves (to be hooked up to the event further below).
        resolveOpts.forEach(opts => {
            listeners.push({
                event: opts.event,
                listener: function maybeResolve(...args) {
                    // If a filter was specified, let it decide whether to act.
                    if (opts.filter === undefined || opts.filter(...args)) {
                        // Hurray, let's resolve. First clean up our listeners.
                        removeListeners()
                        // Resolve, with the specified value if any.
                        if (opts.value) {
                            resolve(castFuncToValue(opts.value, args))
                        } else {
                            resolve()
                        }
                    }
                },
            })
        })
        // Likewise for the events in rejectOpts.
        rejectOpts.forEach(opts => {
            listeners.push({
                event: opts.event,
                listener: function maybeReject(...args) {
                    if (opts.filter === undefined || opts.filter(...args)) {
                        removeListeners()
                        const reason = castFuncToValue(opts.reason, args)
                        // Be neat and always reject with an instance of Error.
                        const error = (reason instanceof Error)
                            ? reason
                            : new Error(reason)
                        reject(error)
                    }
                },
            })
        })

        // Attach the listeners created above to their events.
        listeners.forEach(listener => {
            listener.event.addListener(listener.listener)
        })
    })
}

function castToArray(value) {
    if (Array.isArray(value)) return value
    else if (value === undefined) return []
    else return [value]
}

// Identity function, except that if passed a function, its return value.
// ('resolve' would be a better term than 'cast', but too confusing in this context)
function castFuncToValue(functionOrValue, args = []) {
    const value = (typeof functionOrValue === 'function')
        ? functionOrValue(...args)
        : functionOrValue
    return value
}

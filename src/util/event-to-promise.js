// Create a promise that resolves when resolve.event occurs, or rejects when
// reject.event occurs. Either argument may also be an array of multiple such
// resolve (/reject) settings; whichever triggers first completes the promise.
//
// Arguments:
// - resolve.event (/reject.event)
//   The event to listen to.
// - resolve.filter (/reject.filter)
//   Supply an event handler that returns either true or false if you wish to
//   decide for each event whether to resolve(/reject) or ignore it.
// - resolve.value (/reject.reason)
//   The value to resolve (/reason to reject) with; or a function that provides
//   this value (which receives the event handler's arguments).
export default function eventToPromise({
    resolve: resolveOpts,
    reject: rejectOpts,
}) {
    // We can get a single options object, or an array of them, or undefined.
    if (!Array.isArray(resolveOpts)) {
        resolveOpts = (resolveOpts !== undefined) ? [resolveOpts] : []
    }
    if (!Array.isArray(rejectOpts)) {
        rejectOpts = (rejectOpts !== undefined) ? [rejectOpts] : []
    }

    return new Promise(function (resolve, reject) {
        const listeners = []
        function removeListeners() {
            listeners.forEach(listener => {
                listener.event.removeListener(listener.listener)
            })
        }
        resolveOpts.forEach(opts => {
            listeners.push({
                event: opts.event,
                listener: function maybeResolve(...args) {
                    if (!opts.filter || opts.filter(...args)) {
                        removeListeners()
                        if (opts.value) {
                            const value = (typeof opts.value === 'function')
                                ? opts.value(...args)
                                : opts.value
                            resolve(value)
                        } else { resolve() }
                    }
                },
            })
        })
        rejectOpts.forEach(opts => {
            listeners.push({
                event: opts.event,
                listener: function maybeReject(...args) {
                    if (!opts.filter || opts.filter(...args)) {
                        removeListeners()
                        const reason = (typeof opts.reason === 'function')
                            ? opts.reason(...args)
                            : opts.reason
                        const error = (reason instanceof Error)
                            ? reason
                            : new Error(reason)
                        reject(error)
                    }
                },
            })
        })
        listeners.forEach(listener => {
            listener.event.addListener(listener.listener)
        })
    })
}

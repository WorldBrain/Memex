// Create a promise that resolves when resolve.event occurs, or rejects when
// reject.event occurs.
// Arguments:
// - resolve.event (/reject.event)
// The event to listen to. Either can be omitted.
// - resolve.filter (/reject.filter)
// Supply an event handler that returns either true or false if you wish to
// decide whether to resolve(/reject) or ignore an event.
// - resolve.value (/reject.reason)
// A function that provides the value to resolve (/reason to reject) with.
// Will be called with the event handler's arguments.
export default function eventToPromise({
    resolve: resolveOpts,
    reject: rejectOpts,
}) {
    return new Promise(function (resolve, reject) {
        function maybeResolve(...args) {
            if (!resolveOpts.filter || resolveOpts.filter(...args)) {
                removeListeners()
                if (resolveOpts.value)
                    return (typeof resolveOpts.value === 'function')
                        ? resolve(resolveOpts.value(...args))
                        : resolve(resolveOpts.value)
                else
                    resolve()
            }
        }
        function maybeReject(...args) {
            if (!rejectOpts.filter || rejectOpts.filter(...args)) {
                removeListeners()
                if (rejectOpts.reason)
                    return (typeof rejectOpts.reason === 'function')
                        ? reject(rejectOpts.reason(...args))
                        : reject(rejectOpts.reason)
                else
                    reject()
            }
        }
        function removeListeners() {
            resolveOpts.event && resolveOpts.event.removeListener(maybeResolve)
            rejectOpts.event && rejectOpts.event.removeListener(maybeReject)
        }
        resolveOpts.event && resolveOpts.event.addListener(maybeResolve)
        rejectOpts.event && rejectOpts.event.addListener(maybeReject)
    })
}

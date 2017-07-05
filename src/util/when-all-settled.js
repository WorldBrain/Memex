// Like Promise.all, but it does not mind if any of the promises reject.


// By default, log rejections to the console when not in production mode.
const debugEnabled = (
    process && process.env && process.env.NODE_ENV !== 'production'
)
const defaultRejectionHandler = debugEnabled
    ? error => { console.error(error) }
    : () => {}

// Creates a Promise that resolves when all promises passed to it have settled
// (= either resolved or rejected). This is almost the same as Promise.all,
// except it does not reject when some of the given promises reject.
//
// Arguments:
// - promises: an array of Promises to wait for.
// - options: {
//      onRejection (optional):
//          A rejection handler attached to each given promise.
//          Note: if it throws an error, the returned promise rejects.
//   }
//
// Returns: a Promise.
export default function whenAllSettled(promises, {
    onRejection = defaultRejectionHandler,
} = {}) {
    return Promise.all(
        // Map each promise to a promise that never rejects.
        promises.map(p => Promise.resolve(p).catch(onRejection))
    )
}

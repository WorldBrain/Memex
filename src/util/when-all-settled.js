// Like Promise.all, but it does not mind if any of the promises reject.

const debugEnabled = (
    process && process.env && process.env.NODE_ENV !== 'production'
)

function defaultRejectionHandler(err) {
    if (debugEnabled) {
        console.error(err)
    }
}

export default function whenAllSettled(promises, {
    onRejection = defaultRejectionHandler,
} = {}) {
    return Promise.all(
        promises.map(p => Promise.resolve(p).catch(onRejection))
    )
}

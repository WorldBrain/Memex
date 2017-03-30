// Like Promise.all, but it does not mind if any of the promises reject.
export default function whenAllSettled(promises, {
    onRejection = err => {},
} = {}) {
    return Promise.all(
        promises.map(p => p.catch(onRejection))
    )
}

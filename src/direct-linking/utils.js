export class RetryTimeoutError extends Error {
    static isRetryTimeoutError = true
}

export function retryUntil(
    promiseCreator,
    condition,
    { intervalMiliseconds, timeoutMiliseconds },
) {
    const startMs = Date.now()
    return new Promise((resolve, reject) => {
        const doTry = async () => {
            // console.log('trying')

            let res
            try {
                res = await promiseCreator()
            } catch (e) {
                reject(e)
                return true
            }

            const valid = condition(res)
            if (valid) {
                resolve(res)
            }
            return valid
        }

        const tryOrRetryLater = async () => {
            if (await doTry()) {
                return
            }

            if (Date.now() - startMs >= timeoutMiliseconds) {
                return reject(new RetryTimeoutError())
            }

            // console.log('scheduling retry')
            setTimeout(tryOrRetryLater, intervalMiliseconds)
        }

        tryOrRetryLater()
    })
}

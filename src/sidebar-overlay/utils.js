import { RetryTimeoutError } from '../direct-linking/utils'

export function retryUntilErrorResolves(
    promiseCreator,
    { intervalMiliseconds, timeoutMiliseconds },
) {
    const startMs = Date.now()
    return new Promise((resolve, reject) => {
        const doTry = async () => {
            let res
            try {
                res = await promiseCreator()
                resolve(res)
                return true
            } catch (e) {
                return false
            }
        }

        const tryOrRetryLater = async () => {
            if (await doTry()) {
                resolve(true)
                return
            }

            if (Date.now() - startMs >= timeoutMiliseconds) {
                return reject(new RetryTimeoutError())
            }

            setTimeout(tryOrRetryLater, intervalMiliseconds)
        }

        tryOrRetryLater()
    })
}

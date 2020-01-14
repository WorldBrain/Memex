import Dexie, { DexieError } from 'dexie'

/**
 * Error hanlder captures `OpenFailedError`s relating to `createObjectStore` IDB issues,
 * allowing all other errors to get thrown. We do this as some users experience a fatal issue
 * with this error rendering the DB unusable, but spamming our sentry error tracker.
 */
export const initErrHandler = <T>(defReturnVal: T = null) => (
    err: DexieError,
) => {
    if (
        err.message === 'Data fetch failed' ||
        (err.name === Dexie.errnames.OpenFailedError &&
            err.message.includes('createObjectStore'))
    ) {
        return defReturnVal
    }

    throw err
}

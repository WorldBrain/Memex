import * as Raven from 'src/util/raven'

export const dbQuotaErrors = new Set<string>([
    'AbortError',
    'OpenFailedError',
    'InvalidStateError',
    'QuotaExceededError',
    'TransactionInactiveError',
])

export const handleDBQuotaErrors = <R = any>(
    defaultHandler: (err: Error) => R,
    notableErrorHandler: (err: Error) => R = () => undefined,
    notableErrors = dbQuotaErrors,
) => (err: Error) => {
    if (!notableErrors.has(err.name)) {
        Raven.captureException(err)
        return defaultHandler(err)
    }

    return notableErrorHandler(err)
}

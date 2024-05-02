import * as AllRaven from 'raven-js'
import createRavenMiddleware from 'raven-for-redux'

const extUrlPattern = /^(chrome|moz)-extension:\/\//

// Issue with the export being a default but something with our tsconfig; TODO
const raven = AllRaven['default']
let sentryEnabled = true // TODO: Set this based on user preference

/**
 * Inits Sentry's JS client Raven. Optionally supports adding redux middleware,
 * if middleware array passed in. Note this array will be updated.
 */
export default function initSentry({
    reduxMiddlewares,
    stateTransformer = (f) => f,
}: {
    reduxMiddlewares?: Function[] // tslint:disable-line
    stateTransformer?: (state: any) => any
}) {
    if (process.env.SENTRY_DSN) {
        raven
            .config(process.env.SENTRY_DSN, {
                shouldSendCallback: () => sentryEnabled,
                whitelistUrls: [extUrlPattern],
                includePaths: [extUrlPattern],
            })
            .install()

        // If defined, add raven middleware to passed-in middlewares
        if (reduxMiddlewares) {
            reduxMiddlewares.push(
                createRavenMiddleware(raven, { stateTransformer }),
            )
        }
    }
}

export const setUserContext = (
    userInfo?: { email: string; id: string } | null,
) => raven.setUserContext(userInfo ?? undefined)

export const context = (cb: () => Promise<void> | Promise<boolean> | void) =>
    raven.context(cb)
export const captureException = (
    error: Error | ErrorEvent | string,
    context?: any,
) => raven.captureException(error, context)
export const captureBreadcrumb = (details: any) =>
    raven.captureBreadcrumb(details)

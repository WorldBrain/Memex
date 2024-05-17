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
                ignoreErrors: IGNORED_ERRORS,
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

const IGNORED_ERRORS = [
    `No registered remote function called handleHistoryStateUpdate`,
    `No registered remote function called confirmTabScriptLoaded`,
    `No registered remote function called teardownContentScripts`,
    `Error: Could not get a port to content-script-background`,
    `Cannot destructure property 'id' of 'i' as it is undefined.`,
    `NotAllowedError: Registration failed - permission denied`,
    `An error occurred. See https://git.io/JUIaE#17 for more information.`,
    `AbortError: Registration failed - push service error`,
    `Could not establish connection. Receiving end does not exist.`,
    `Error: Cannot inject content-scripts into page`,
    `Error: No tab with id:`,
    `Unable to download all specified images.`,
    `Could not establish connection. Receiving end does not exist.`,
    `A listener indicated an asynchronous response by returning true`,
    `DatabaseClosedError: UnknownError`,
    `DatabaseClosedError: InvalidStateError`,
    `DatabaseClosedError: UpgradeError`,
    `UpgradeError Not yet support for changing primary key`,
    `Tried to do 'findObjects' operation on non-existing collection: settings`,
    `Invariant Violation: update(): You provided an invalid spec to update().`,
]

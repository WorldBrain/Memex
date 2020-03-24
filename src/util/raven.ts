import { browser } from 'webextension-polyfill-ts'
import * as AllRaven from 'raven-js'
import createRavenMiddleware from 'raven-for-redux'

import { StorageChangesManager } from './storage-changes'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from '../options/privacy/constants'

// Issue with the export being a default but something with our tsconfig; TODO
const raven = AllRaven['default']
let sentryEnabled = false

// Init the enabled state based on stored flag
browser.storage.local
    .get(SHOULD_TRACK)
    .then(storage => (sentryEnabled = !!storage[SHOULD_TRACK]))

/**
 * Inits Sentry's JS client Raven. Optionally supports adding redux middleware,
 * if middleware array passed in. Note this array will be updated.
 */
export default function initSentry({
    reduxMiddlewares,
    stateTransformer = f => f,
    storageChangesManager = new StorageChangesManager({
        storage: browser.storage,
    }),
}: {
    reduxMiddlewares?: Function[] // tslint:disable-line
    stateTransformer?: (state: any) => any
    storageChangesManager?: StorageChangesManager
}) {
    // Update global tracking flag every time stored flag changes
    storageChangesManager.addListener(
        'local',
        SHOULD_TRACK,
        ({ newValue }) => (sentryEnabled = newValue),
    )

    if (process.env.SENTRY_DSN) {
        raven
            .config(process.env.SENTRY_DSN, {
                shouldSendCallback: () => sentryEnabled,
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

export const context = (cb: () => Promise<void> | void) => raven.context(cb)
export const captureException = (error: Error) => raven.captureException(error)
export const captureBreadcrumb = (details: any) =>
    raven.captureBreadcrumb(details)

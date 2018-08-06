import { browser } from 'webextension-polyfill-ts'
import * as AllRaven from 'raven-js'
import createRavenMiddleware from 'raven-for-redux'

import { storageChangesManager } from './storage-changes'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from '../options/privacy/constants'

// Issue with the export being a default but something with our tsconfig; TODO
const raven = AllRaven['default']
let sentryEnabled = false

// Init the enabled state based on stored flag
browser.storage.local // tslint:disable-line
    .get(SHOULD_TRACK)
    .then(storage => (sentryEnabled = !!storage[SHOULD_TRACK]))

// Update global tracking flag every time stored flag changes
storageChangesManager.addListener(
    'local',
    SHOULD_TRACK,
    ({ newValue }) => (sentryEnabled = newValue),
)

/**
 * Inits Sentry's JS client Raven. Optionally supports adding redux middleware,
 * if middleware array passed in. Note this array will be updated.
 */
export default function initSentry(
    reduxMiddlewares?: Function[], // tslint:disable-line
    stateTransformer = f => f,
) {
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

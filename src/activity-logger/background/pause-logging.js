/* eslint eqeqeq: 0 */
import createNotif from 'src/util/notifications'
import { PAUSE_STORAGE_KEY } from '..'

export const pauseIconPath = '/img/worldbrain-logo-narrow-pause.png'
export const unpauseIconPath = '/img/worldbrain-logo-narrow-bw.png'

const getState = async () => {
    const state = (await browser.storage.local.get(PAUSE_STORAGE_KEY))[
        PAUSE_STORAGE_KEY
    ]

    switch (state) {
        case 0:
            return Infinity
        case 1:
            return true
        case 2:
        default:
            return false
    }
}

const setState = async state => {
    const transformState = val => {
        switch (val) {
            case Infinity: {
                browser.browserAction.setIcon({ path: pauseIconPath })
                return 0
            }
            case true: {
                browser.browserAction.setIcon({ path: pauseIconPath })
                return 1
            }
            case false:
            default: {
                browser.browserAction.setIcon({ path: unpauseIconPath })
                return 2
            }
        }
    }

    return browser.storage.local.set({
        [PAUSE_STORAGE_KEY]: transformState(state),
    })
}

function handleInterrupt(timeoutId) {
    if (timeoutId != Infinity && !!timeoutId) {
        clearTimeout(timeoutId)
    }
    setState(false)
}

function handlePause(timeout) {
    // We don't want to make a timeout for Infinity (it doesn't work), so needs to be handled differently
    if (timeout == Infinity) {
        return timeout
    }

    return setTimeout(() => {
        createNotif({
            message: 'Activity logger now running in background again',
            title: 'WorldBrain Activity Logger',
            requireInteraction: true,
        })
        setState(false)
    }, timeout * 60000)
}

/**
 * Main entrypoint for activity-logging pause from the popup. Keeps track of a running pause timeout
 * which will reset the pause flag in local storage.
 *
 * @return {(number?) => void} A function that allows pause state to be toggled, and optional
 *  specifying of a number of minutes for timeout.
 */
export default function initPauser() {
    let timeoutId
    // Set default unpaused state in local storage flag, unless Infinity is set
    getState()
        .then(initState => initState != Infinity && setState(false))
        .catch(f => f) // noop

    // Either clears or sets the pause timeout depending on its running state as denoted by local storage flag
    return async timeoutMins => {
        timeoutMins = timeoutMins || Infinity

        const isPaused = await getState()
        // Immediately toggle the local storage flag and continue on
        setState(timeoutMins == Infinity ? Infinity : !isPaused)

        if (isPaused) {
            handleInterrupt(timeoutId)
        } else {
            // New pause timeout request
            timeoutId = handlePause(timeoutMins)
        }
    }
}

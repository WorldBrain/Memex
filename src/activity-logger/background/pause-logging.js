import { PAUSE_STORAGE_KEY } from '..'

const getState = async () => (await browser.storage.local.get(PAUSE_STORAGE_KEY))[PAUSE_STORAGE_KEY] || false
const setState = state => browser.storage.local.set({ [PAUSE_STORAGE_KEY]: state })

/**
 * Main entrypoint for activity-logging pause from the popup. Keeps track of a running pause timeout
 * which will reset the pause flag in local storage.
 *
 * @return {(number?) => void} A function that allows pause state to be toggled, and optional
 *  specifying of a number of minutes for timeout.
 */
export default function initPauser() {
    const unpause = () => setState(false)
    let timeoutId
    setState(false) // Set default unpaused state in local storage flag

    // Either clears or sets the pause timeout depending on its running state as denoted by local storage flag
    return async timeoutMins => {
        const isPaused = await getState()
        setState(!isPaused) // Immediately toggle the local storage flag and continue on

        timeoutId = isPaused
            ? clearTimeout(timeoutId)
            : setTimeout(unpause, timeoutMins * 60000)
    }
}

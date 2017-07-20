import { PAUSE_STORAGE_KEY } from '..'

const getNotifOptions = (message, requireInteraction = false) => ({
    type: 'basic',
    iconUrl: '/overview/img/worldbrain-logo-narrow.png',
    title: 'WorldBrain Activity Logger',
    message,
    requireInteraction,
})

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
    let timeoutId
    setState(false) // Set default unpaused state in local storage flag

    const unpause = () => {
        browser.notifications.create(getNotifOptions('Activity logger now running in background again', true))
        setState(false)
    }

    // Either clears or sets the pause timeout depending on its running state as denoted by local storage flag
    return async timeoutMins => {
        const isPaused = await getState()
        setState(!isPaused) // Immediately toggle the local storage flag and continue on

        if (isPaused) { // Interrupt
            clearTimeout(timeoutId)
            unpause()
        } else { // New pause timeout request
            browser.notifications.create(getNotifOptions(`Activity logger now paused for ${timeoutMins} mins`))
            timeoutId = setTimeout(unpause, timeoutMins * 60000)
        }
    }
}

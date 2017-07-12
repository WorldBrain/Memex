/**
 * Higher order function to make another function only be invoked when user is deemed idle.
 * Wraps around the web extension browser.idle API.
 *
 * @param {function} task Async or sync function to run after idle.
 * @param {number} [idleTimeout=15] Number of seconds to consider user idle (min is 15)
 */
export const makeDelayedTask = (task, idleTimeout = 15) => () => {
    browser.idle.setDetectionInterval(idleTimeout)

    async function runWhenIdle(idleState) {
        if (idleState === 'idle') {
            await task()
            // Make sure to remove listner (itself) after runnings once
            browser.idle.onStateChanged.removeListener(runWhenIdle)
        }
    }

    browser.idle.onStateChanged.addListener(runWhenIdle)
}

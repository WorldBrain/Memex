/**
 * Higher order function to make another function only be invoked when user is deemed idle.
 * Wraps around the web extension browser.idle API.
 *
 * @param {(any) => Promise<any>} task Async or sync function to run after idle.
 * @param {number} [idleTimeout=15] Number of seconds to consider user idle (min is 15)
 * @return {(any) => Promise<any>} Augmented version of `task` that, when invoked, will only run when user idle.
 *  A Promise will be returned which the invoker can use to wait for eventual output.
 */
export const makeDelayedTask = (task, idleTimeout = 15) => (...args) => new Promise((resolve, reject) => {
    browser.idle.setDetectionInterval(idleTimeout)

    async function runWhenIdle(idleState) {
        if (idleState === 'idle') {
            try {
                const output = await task(...args)
                resolve(output)
            } catch (error) {
                reject(error)
            } finally { // Make sure to remove listner (itself) after running once
                browser.idle.onStateChanged.removeListener(runWhenIdle)
            }
        }
    }

    browser.idle.onStateChanged.addListener(runWhenIdle)
})

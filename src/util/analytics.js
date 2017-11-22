import Piwik from 'piwik-react-router'

/**
 * @typedef {Object} EventTrackInfo
 * @property {string} category The event category ('Search', 'Blacklist', etc.).
 * @property {string} action The event action ('Add Entry', etc.).
 * @property {string} [name] The optional event name (user input - other custom info).
 * @property {number} [value] The optional event value (should be numeric).
 */

class Analytics {
    instance

    /**
     * @param {Object} args
     * @param {string} args.url Address of the analytics server host.
     * @param {string} args.siteId Piwik site ID for the site to track.
     */
    constructor(args) {
        this.instance = Piwik(args)
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     */
    trackEvent(eventArgs) {
        const eventData = [
            'trackEvent',
            eventArgs.category,
            eventArgs.action,
            eventArgs.name,
            eventArgs.value,
        ]

        return this.instance.push(eventData)
    }

    // Default method wrappers
    connectToHistory(history) {
        return this.instance.connectToHistory(history)
    }
}

const analytics = new Analytics({
    url: process.env.PIWIK_HOST,
    siteId: process.env.PIWIK_SITE_ID,
    trackErrors: true,
})

export default analytics

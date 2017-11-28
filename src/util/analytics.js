import Piwik from 'piwik-react-router'

/**
 * @typedef {Object} EventTrackInfo
 * @property {string} category The event category ('Search', 'Blacklist', etc.).
 * @property {string} action The event action ('Add Entry', etc.).
 * @property {string} [name] The optional event name (user input - other custom info).
 * @property {number} [value] The optional event value (should be numeric).
 */

/**
 * @typedef {Object} LinkTrackInfo
 * @property {string} url The full URL being linked to.
 * @property {'link'|'download'} [linkType='link'] Signifies if link is to a page or download.
 */

class Analytics {
    instance
    _shouldTrack

    /**
     * @param {Object} args
     * @param {string} args.url Address of the analytics server host.
     * @param {string} args.siteId Piwik site ID for the site to track.
     */
    constructor(args) {
        this.instance = Piwik(args)
    }

    set shouldTrack(value) {
        this._shouldTrack = !!value
    }

    get shouldTrack() {
        return this._shouldTrack
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     */
    trackEvent(eventArgs) {
        if (!this._shouldTrack) {
            return
        }

        const data = [
            'trackEvent',
            eventArgs.category,
            eventArgs.action,
            eventArgs.name,
            eventArgs.value,
        ]

        return this.instance.push(data)
    }

    /**
     * Track user link clicks.
     *
     * @param {LinkTrackInfo} linkArgs
     */
    trackLink(linkArgs) {
        if (!this._shouldTrack) {
            return
        }

        const data = ['trackLink', linkArgs.url, linkArgs.linkType || 'link']

        return this.instance.push(data)
    }

    // Default method wrappers
    connectToHistory(history) {
        // NOTE: This breaks page tracking as router is init'd before this state is properly set;
        // TODO: Probably easiest way is to move to manual page tracking on a top-level `withRouter` component
        if (!this._shouldTrack) {
            return history
        }

        return this.instance.connectToHistory(history)
    }
}

const analytics = new Analytics({
    url: process.env.PIWIK_HOST,
    siteId: process.env.PIWIK_SITE_ID,
    trackErrors: true,
})

export default analytics

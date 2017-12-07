import Piwik from 'piwik-react-router'

import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'

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

    /**
     * @param {Object} args
     * @param {string} args.url Address of the analytics server host.
     * @param {string} args.siteId Piwik site ID for the site to track.
     */
    constructor(args) {
        this.instance = Piwik(args)
    }

    async shouldTrack() {
        const storage = await browser.storage.local.get({
            [SHOULD_TRACK]: true,
        })

        return storage[SHOULD_TRACK]
    }

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     */
    async trackEvent(eventArgs) {
        if (!await this.shouldTrack()) {
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
    async trackLink(linkArgs) {
        if (!await this.shouldTrack()) {
            return
        }

        const data = ['trackLink', linkArgs.url, linkArgs.linkType || 'link']

        return this.instance.push(data)
    }

    /**
     * Track user page visits.
     *
     * @param {History.Location} loc Location object received from React Router.
     */
    async trackPage(loc) {
        if (!await this.shouldTrack()) {
            return
        }

        this.instance.track(loc)
    }
}

const analytics = new Analytics({
    url: process.env.PIWIK_HOST,
    siteId: process.env.PIWIK_SITE_ID,
    trackErrors: true,
})

export default analytics

/* eslint no-console: 0 */
import { idleManager } from 'src/util/idle'
import randomString from 'src/util/random-string'
import { shouldTrack } from './utils'
import { AnalyticsBackend } from './backend/types'
import { AnalyticsEvent, Analytics, AnalyticsTrackEventOptions } from './types'

const TRACK_BY_DEFAULT = true

export default class AnalyticsManager implements Analytics {
    constructor(private options: { backend: AnalyticsBackend }) {}

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent(
        event: AnalyticsEvent,
        options?: AnalyticsTrackEventOptions,
    ) {
        const shouldTrackValue = await this._shouldTrack()
        if (process.env.DEBUG_ANALYTICS_EVENTS === 'true') {
            console.log('Tracking event', shouldTrackValue, event, options) // tslint:disable-line
        }
        if (!shouldTrackValue) {
            return
        }
        await this.options.backend.trackEvent(event, options)
    }

    /**
     * Track user link clicks.
     *
     * @param {LinkTrackInfo} linkArgs
     */
    async trackLink({ linkType, url }) {}

    /**
     * Track user page visits.
     *
     * @param {string} args.title The title of the page to track
     */
    async trackPage({ title }) {}

    async _shouldTrack() {
        return shouldTrack(TRACK_BY_DEFAULT)
    }
}

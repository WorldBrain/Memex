/* eslint no-console: 0 */
import { AnalyticsBackend } from './backend/types'
import {
    AnalyticsEvent,
    AnalyticsEvents,
    Analytics,
    AnalyticsTrackEventOptions,
} from './types'
import { ANALYTICS_EVENTS } from './constants'

const TRACK_BY_DEFAULT = true

export default class AnalyticsManager implements Analytics {
    constructor(
        private options: {
            backend: AnalyticsBackend
            shouldTrack: (def?: boolean) => Promise<boolean>
        },
    ) {}

    /**
     * Track any user-invoked events.
     *
     * @param {EventTrackInfo} eventArgs
     * @param {boolean} [force=false] Whether or not to send immediately or just add to request pool.
     */
    async trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ) {
        const shouldTrackValue = await this.options.shouldTrack(
            TRACK_BY_DEFAULT,
        )
        if (process.env.DEBUG_ANALYTICS_EVENTS === 'true') {
            console.log('Tracking event', shouldTrackValue, event, options) // tslint:disable-line
        }
        if (!shouldTrackValue) {
            return
        }

        const eventInfo = (ANALYTICS_EVENTS[event.category] as any)?.[
            event.action
        ]

        if (eventInfo) {
            await this.options.backend.trackEvent(event, options)
        } else if (process.env.NODE_ENV !== 'production') {
            console.warn(
                `Ignoring analytics of non-documented event: '${event.category}' -> '${event.action}'`,
            ) // tslint:disable-line
        }
    }
}

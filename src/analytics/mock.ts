import {
    AnalyticsEvent,
    AnalyticsEvents,
    Analytics,
    AnalyticsTrackEventOptions,
} from './types'

export class FakeAnalytics implements Analytics {
    events: Array<{
        eventArgs: AnalyticsEvent<keyof AnalyticsEvents>
        options: AnalyticsTrackEventOptions
    }>
    newEvents: Array<{
        eventArgs: AnalyticsEvent<keyof AnalyticsEvents>
        options: AnalyticsTrackEventOptions
    }>
    constructor() {
        this.reset()
    }
    reset() {
        this.events = []
        this.newEvents = []
    }
    async trackEvent(eventArgs, options?: AnalyticsTrackEventOptions) {
        this.events.push({ eventArgs, options })
        this.newEvents.push({ eventArgs, options })
    }
    popNew() {
        const newEvents = this.newEvents
        this.newEvents = []
        return newEvents
    }
}

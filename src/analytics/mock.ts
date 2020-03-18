import { AnalyticsEvent, Analytics, AnalyticsTrackEventOptions } from './types'
export class FakeAnalytics implements Analytics {
    events: Array<{
        eventArgs: AnalyticsEvent
        options: AnalyticsTrackEventOptions
    }>
    newEvents: Array<{
        eventArgs: AnalyticsEvent
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

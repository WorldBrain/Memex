import Analytics from './analytics'

const analytics = new Analytics({
    url: process.env.PIWIK_HOST,
    siteId: process.env.PIWIK_SITE_ID,
    trackErrors: true,
})

export class FakeAnalytics {
    constructor() {
        this.reset()
    }

    reset() {
        this.events = []
        this.newEvents = []
    }

    async trackEvent(eventArgs, force = false) {
        this.events.push({ eventArgs, force })
        this.newEvents.push({ eventArgs, force })
    }

    popNew() {
        const newEvents = this.newEvents
        this.newEvents = []
        return newEvents
    }
}

export default analytics

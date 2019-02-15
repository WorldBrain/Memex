import Analytics from './analytics'
import { STORAGE_KEYS } from './constants'

/**
 * Update the last recorded user activity timestamp (used for determining user activity in given periods).
 */
export const updateLastActive = () =>
    browser.storage.local.set({
        [STORAGE_KEYS.LAST_ACTIVE]: Date.now(),
    })

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

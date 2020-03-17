import AnalyticsManager from './analytics'
import { AnalyticsEvent, Analytics, AnalyticsTrackEventOptions } from './types'
import FirebaseAnalyticsBackend from './backend/firebase'

const createBackend = () => new FirebaseAnalyticsBackend()
let realBackend = null
const backend = new Proxy(
    {},
    {
        get: (target, key) => {
            if (!realBackend) {
                realBackend = createBackend()
            }
            return realBackend[key]
        },
    },
) as Analytics
const analytics: Analytics = new AnalyticsManager({ backend })

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

export default analytics

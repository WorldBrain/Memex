import Countly from 'countly-sdk-web'

import AnalyticsManager from './analytics'
import CountlyAnalyticsBackend from './backend/countly'
import { FakeAnalytics } from './mock'
import { Analytics } from './types'

let analytics: Analytics

try {
    const backend = new CountlyAnalyticsBackend({
        countlyConnector: Countly,
        appKey: process.env.COUNTLY_APP_KEY,
        url: process.env.COUNTLY_SERVER_URL,
    })

    analytics = new AnalyticsManager({ backend })
} catch (err) {
    analytics = new FakeAnalytics()
}

export default analytics

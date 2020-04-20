import Countly from 'countly-sdk-web'

import AnalyticsManager from './analytics'
import CountlyAnalyticsBackend from './backend/countly'
import { FakeAnalytics } from './mock'
import { Analytics } from './types'
import { generateUserId, shouldTrack } from './utils'

const appKey = process.env.COUNTLY_APP_KEY
const url = process.env.COUNTLY_SERVER_URL

let analytics: Analytics

if (
    !appKey ||
    !url ||
    (process.env.NODE_ENV === 'development' &&
        process.env.DEV_ANALYTICS !== 'true')
) {
    analytics = new FakeAnalytics()
} else {
    analytics = new AnalyticsManager({
        shouldTrack: def => shouldTrack(def),
        backend: new CountlyAnalyticsBackend({
            fetchUserId: () => generateUserId({}),
            countlyConnector: Countly,
            appKey,
            url,
        }),
    })
}

export default analytics

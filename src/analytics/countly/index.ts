import Countly from 'countly-sdk-web'

import Analytics from './analytics'

const analytics = new Analytics({
    url: process.env.COUNTLY_HOST,
    appKey: process.env.COUNTLY_APP_KEY,
    countlyConnector: Countly,
})

window['testers'] = analytics
export default analytics

import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import analytics, { updateLastActive } from '..'
import './periodic'

makeRemotelyCallable({
    trackEvent: (...args) => analytics.trackEvent(...args),
    updateLastActive,
})

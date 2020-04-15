// tslint:disable:no-console
import { generateUserId } from '../utils'
import { AnalyticsBackend } from './types'
import { AnalyticsEvent, AnalyticsTrackEventOptions } from '../types'
import { getFirebase } from 'src/util/firebase-app-initialized'

export default class FirebaseAnalyticsBackend implements AnalyticsBackend {
    async trackEvent(
        event: AnalyticsEvent,
        options?: AnalyticsTrackEventOptions,
    ) {
        const firebase = getFirebase()
        firebase.analytics().setUserId(await generateUserId({}))
        firebase.analytics().logEvent(
            `${event.category}::${event.action}`,
            event.value
                ? {
                      value: event.value,
                  }
                : {},
        )
    }
}

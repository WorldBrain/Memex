import type * as commonAnalyticsTypes from '@worldbrain/memex-common/lib/analytics/types'
import { Analytics } from '../types'
import { updateLastActive } from '../utils'

export interface AnalyticsInterface {
    trackEvent: Analytics['trackEvent']
    rawTrackEvent(
        event: Omit<commonAnalyticsTypes.AnalyticsEvent, 'createdWhen'>,
    ): Promise<void>
    updateLastActive: typeof updateLastActive
}

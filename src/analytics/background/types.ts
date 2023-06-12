import { ClientAnalyticsEvent } from '@worldbrain/memex-common/lib/analytics/types'
import { Analytics } from '../types'
import { updateLastActive } from '../utils'

export interface AnalyticsInterface {
    trackEvent: Analytics['trackEvent']
    trackBqEvent(event: ClientAnalyticsEvent): Promise<void>
    updateLastActive: typeof updateLastActive
}

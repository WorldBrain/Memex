import { Analytics } from '../types'
import { updateLastActive } from '../utils'

export interface AnalyticsInterface {
    trackEvent: Analytics['trackEvent']
    updateLastActive: typeof updateLastActive
}

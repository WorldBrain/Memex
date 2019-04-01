import { AnalyticsTrackEventOptions } from '../types'

export interface AnalyticsBackend {
    trackEvent(event, options?: AnalyticsTrackEventOptions): Promise<void>
}

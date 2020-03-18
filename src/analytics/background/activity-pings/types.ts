import { AnalyticsEvents } from 'src/analytics/types'

export type ActivityPingFrequency = 'daily' | 'weekly' | 'monthly'
export interface ActivityPingSettings {
    lastPingTimestamps: { [Frequency in ActivityPingFrequency]: number }
    pendingActivityPings: {
        [Frequency in ActivityPingFrequency]: Array<keyof AnalyticsEvents>
    }
}

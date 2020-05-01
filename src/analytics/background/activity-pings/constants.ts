import { AnalyticsEvents } from 'src/analytics/types'
import { ActivityPingFrequency } from './types'

export const DEFAULT_PING_INTERVALS: {
    [Frequency in ActivityPingFrequency]: number
} = {
    daily: 1000 * 60 * 60 * 24,
    weekly: 1000 * 60 * 60 * 24 * 7,
    monthly: 1000 * 60 * 60 * 24 * 30,
}

export const ACTIVITY_PINGS: {
    [Category in keyof AnalyticsEvents]?: {
        [Action in AnalyticsEvents[Category]]?: true
    }
} = {
    Annotations: { createWithTags: true },
}

export interface Analytics {
    trackEvent<Category extends keyof AnalyticsEvents>(
        event: AnalyticsEvent<Category>,
        options?: AnalyticsTrackEventOptions,
    ): Promise<any>
}

export interface AnalyticsEvent<Category extends keyof AnalyticsEvents> {
    action: AnalyticsEvents[Category] // ('Add Entry', etc.).
    category: Category // ('Search', 'Blacklist', etc.).
    name?: string // (user input - other custom info)
    value?: any
}

export interface AnalyticsTrackEventOptions {
    waitForCompletion?: boolean
}

export interface AnalyticsEvents {
    'Activity Pings': 'daily' | 'weekly' | 'monthly'
    Annotations: 'createWithTags' | 'createWithoutTags'
    Privacy: 'Change tracking pref'
}

export interface AnalyticsEventInfo {
    description: string
}

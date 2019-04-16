export interface Analytics {
    trackEvent(
        event: AnalyticsEvent,
        options?: AnalyticsTrackEventOptions,
    ): Promise<any>
}

export interface AnalyticsEvent {
    category: string // ('Search', 'Blacklist', etc.).
    action: string // ('Add Entry', etc.).
    name?: string // (user input - other custom info)
    value?: any
}

export interface AnalyticsTrackEventOptions {
    waitForCompletion?: boolean
}

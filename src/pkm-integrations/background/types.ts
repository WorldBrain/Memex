export interface PkmSyncInterface {
    addRSSfeedSource(feedUrl: string, isSubstack: boolean): Promise<void>
    checkConnectionStatus(): Promise<boolean | 'not-available'>
}

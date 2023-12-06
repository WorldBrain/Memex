export interface PkmSyncInterface {
    addRSSfeedSource(feedUrl: string, isSubstack: boolean): Promise<void>
}

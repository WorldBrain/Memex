export interface BookmarksInterface {
    addPageBookmark({
        url,
        timestamp,
        tabId,
    }: {
        url: string
        timestamp?: number
        tabId?: number
    }): Promise<any>

    delPageBookmark({ url }: { url: string }): Promise<any>
}

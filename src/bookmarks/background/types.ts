export interface BookmarksInterface {
    addPageBookmark(args: {
        url: string
        fullUrl?: string
        timestamp?: number
        tabId?: number
    }): Promise<any>

    delPageBookmark(args: { url: string }): Promise<any>
}

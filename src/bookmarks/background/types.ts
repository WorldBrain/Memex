import type { Bookmark } from '@worldbrain/memex-common/lib/storage/modules/mobile-app/features/overview/types'

export interface BookmarksInterface {
    addPageBookmark(args: {
        url?: string
        fullUrl: string
        timestamp?: number
        tabId?: number
    }): Promise<any>

    delPageBookmark(args: { url: string }): Promise<any>
    pageHasBookmark(url: string): Promise<boolean>
    findBookmark(url: string): Promise<Bookmark | null>
    setBookmarkStatusInBrowserIcon(
        value: boolean,
        pageUrl: string,
    ): Promise<void>
}

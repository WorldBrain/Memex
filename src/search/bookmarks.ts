import { Bookmarks } from 'webextension-polyfill-ts'

import { TabManager } from 'src/activity-logger/background/tab-manager'
import { pageIsStub } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'
import { PageIndexingBackground } from 'src/page-indexing/background'

export const addBookmark = (
    pages: PageIndexingBackground,
    bookmarksStorage: BookmarksStorage,
    tabManager: TabManager,
) => async (params: {
    url: string
    fullUrl: string
    timestamp?: number
    tabId?: number
}) => {
    let page = await pages.storage.getPage(params.url)
    if (page == null || pageIsStub(page)) {
        page = await pages.createPageViaBmTagActs({
            url: params.url,
            fullUrl: params.fullUrl,
            tabId: params.tabId,
        })
    }

    await bookmarksStorage.createBookmarkIfNeeded(page.url, params.timestamp)
    tabManager.setBookmarkState(params.url, true)
}

export const delBookmark = (
    pageStorage: PageStorage,
    bookmarksStorage: BookmarksStorage,
    tabManager: TabManager,
) => async ({ url }: Partial<Bookmarks.BookmarkTreeNode>) => {
    await bookmarksStorage.delBookmark({ url })
    await pageStorage.deletePageIfOrphaned(url)
    tabManager.setBookmarkState(url, false)
}

export const pageHasBookmark = (bookmarksStorage: BookmarksStorage) => async (
    url: string,
) => {
    return bookmarksStorage.pageHasBookmark(url)
}

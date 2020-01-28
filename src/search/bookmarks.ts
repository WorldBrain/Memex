import { Bookmarks } from 'webextension-polyfill-ts'

import { TabManager } from 'src/activity-logger/background/tab-manager'
import { createPageViaBmTagActs } from './on-demand-indexing'
import { pageIsStub } from 'src/page-indexing/utils'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'

export const addBookmark = (
    pageStorage: PageStorage,
    bookmarksStorage: BookmarksStorage,
    tabManager: TabManager,
) => async ({
    url,
    timestamp = Date.now(),
    tabId,
}: {
    url: string
    timestamp?: number
    tabId?: number
}) => {
    const page = await pageStorage.getPage(url)

    if (page == null || pageIsStub(page)) {
        await createPageViaBmTagActs(pageStorage)({ url, tabId })
    }

    await bookmarksStorage.createBookmarkIfNeeded(page.url, timestamp)
    tabManager.setBookmarkState(url, true)
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

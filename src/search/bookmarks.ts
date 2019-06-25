import { Bookmarks } from 'webextension-polyfill-ts'

import { TabManager } from 'src/activity-logger/background/tab-manager'
import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'
import { DBGet } from './types'

export const addBookmark = (getDb: DBGet, tabManager: TabManager) => async ({
    url,
    timestamp = Date.now(),
    tabId,
}: {
    url: string
    timestamp?: number
    tabId?: number
}) => {
    // url = normalizeUrl(url);
    let page = await getPage(getDb)(url)

    if (page == null || page.isStub) {
        page = await createPageViaBmTagActs(getDb)({ url, tabId })
    }

    page.setBookmark(timestamp)
    await page.save()
    tabManager.setBookmarkState(url, true)
}

export const delBookmark = (getDb: DBGet, tabManager: TabManager) => async ({
    url,
}: Partial<Bookmarks.BookmarkTreeNode>) => {
    const page = await getPage(getDb)(url)

    if (page != null) {
        page.delBookmark()

        // Delete if Page left orphaned, else just save current state
        if (page.shouldDelete) {
            await page.delete()
        } else {
            await page.save()
        }
        tabManager.setBookmarkState(url, false)
    }
}

export const pageHasBookmark = (getDb: DBGet) => async (url: string) => {
    const page = await getPage(getDb)(url)

    return page != null ? page.hasBookmark : false
}

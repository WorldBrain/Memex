import { Bookmarks } from 'webextension-polyfill-ts'

import tabManager from '../activity-logger/background/tab-manager'
import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'
import { Dexie } from './types'

export const addBookmark = (getDb: Promise<Dexie>) => async ({
    url,
    timestamp = Date.now(),
    tabId,
}: {
    url: string
    timestamp?: number
    tabId?: number
}) => {
    let page = await getPage(getDb)(url)

    if (page == null || page.isStub) {
        page = await createPageViaBmTagActs(getDb)({ url, tabId })
    }

    page.setBookmark(timestamp)
    await page.save(getDb)
    tabManager.setBookmarkState(url, true)
}

export const delBookmark = (getDb: Promise<Dexie>) => async ({
    url,
}: Partial<Bookmarks.BookmarkTreeNode>) => {
    const page = await getPage(getDb)(url)

    if (page != null) {
        page.delBookmark()

        // Delete if Page left orphaned, else just save current state
        if (page.shouldDelete) {
            await page.delete(getDb)
        } else {
            await page.save(getDb)
        }
        tabManager.setBookmarkState(url, false)
    }
}

export const pageHasBookmark = (getDb: Promise<Dexie>) => async (
    url: string,
) => {
    const page = await getPage(getDb)(url)

    return page != null ? page.hasBookmark : false
}

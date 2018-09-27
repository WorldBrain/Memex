import { Bookmarks } from 'webextension-polyfill-ts'

import tabManager from '../activity-logger/background/tab-manager'
import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'

export async function addBookmark({
    url,
    timestamp = Date.now(),
    tabId,
}: {
    url: string
    timestamp?: number
    tabId?: number
}) {
    let page = await getPage(url)

    if (page == null || page.isStub) {
        page = await createPageViaBmTagActs({ url, tabId })
    }

    page.setBookmark(timestamp)
    await page.save()
    tabManager.setBookmarkState(url, true)
}

export async function delBookmark({
    url,
}: Partial<Bookmarks.BookmarkTreeNode>) {
    const page = await getPage(url)

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

export async function pageHasBookmark(url: string) {
    const page = await getPage(url)

    return page != null ? page.hasBookmark : false
}

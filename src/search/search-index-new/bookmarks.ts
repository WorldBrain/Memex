import { Bookmarks } from 'webextension-polyfill-ts'

import db from '.'
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
}

export async function delBookmark({ url }: Bookmarks.BookmarkTreeNode) {
    const page = await getPage(url)

    if (page != null) {
        page.delBookmark()

        // Delete if Page left orphaned, else just save current state
        if (page.shouldDelete) {
            await page.delete()
        } else {
            await page.save()
        }
    }
}

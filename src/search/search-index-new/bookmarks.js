import db from '.'
import normalizeUrl from 'src/util/encode-url-for-id'
import analysePage from 'src/page-analysis/background'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import pipeline from './pipeline'
import { Page } from './models'

export async function addBookmark({ url, timestamp = Date.now(), tabId }) {
    const normalized = normalizeUrl(url)

    let page = await db.pages.get(normalized)

    // No existing page for BM; need to make new via content-script if `tabId` provided
    if (page == null) {
        if (tabId == null) {
            throw new Error(
                'Page does not exist for URL and no tabID provided to extract content:',
                normalized,
            )
        }

        // TODO: handle screenshot, favicon
        const { content } = await analysePage({ tabId })
        const [pageDoc] = await pipeline({ pageDoc: { content, url } })
        page = new Page(pageDoc)
    }

    return db.transaction('rw', db.tables, async () => {
        await page.loadRels()
        page.setBookmark(timestamp)
        await page.save()
    })
}

export function delBookmark({ url }) {
    const normalized = normalizeUrl(url)

    return db.transaction('rw', db.tables, async () => {
        const page = await db.pages.get(normalized)

        if (page != null) {
            await page.loadRels()
            page.delBookmark()

            // Delete if Page left orphaned, else just save current state
            if (page.shouldDelete) {
                await page.delete()
            } else {
                await page.save()
            }
        }
    })
}

/**
 * Handles the browser `bookmarks.onCreated` event:
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/bookmarks/onCreated
 */
export async function handleBookmarkCreation(browserId, { url }) {
    const normalized = normalizeUrl(url)

    let page = await db.pages.get(normalized)

    // No existing page for BM; need to try and make new from a remote DOM fetch
    if (page == null) {
        const fetch = fetchPageData({
            url,
            opts: { includePageContent: true, includeFavIcon: true },
        })

        const pageData = await fetch.run()
        page = new Page(await pipeline({ pageDoc: { url, ...pageData } }))
    }

    try {
        await db.transaction('rw', db.tables, async () => {
            await page.loadRels()
            page.setBookmark()
            await page.save()
        })
    } catch (err) {
        console.error(err)
    }
}

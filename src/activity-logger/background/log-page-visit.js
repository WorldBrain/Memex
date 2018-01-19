import db from 'src/pouchdb'
import storePage from 'src/page-storage/store-page'
import { generatePageDocId } from 'src/page-storage'
import { generateVisitDocId, visitKeyPrefix } from '..'
import * as index from 'src/search'
import tabManager from './tab-manager'

// Store the visit in PouchDB.
export async function storeVisit({ timestamp, url, page }) {
    const visit = {
        _id: generateVisitDocId({ url, timestamp }),
        visitStart: timestamp,
        url,
        page: { _id: page._id }, // store only a reference to the page
    }
    await db.put(visit)
    return { visit }
}

/**
 * Handles index update, either adding new page + visit, or just adding a visit to existing data.
 *
 * @param {any} reidentifyResult Object containing the existing page/page stub + promise resolving
 *  to the new page.
 * @param {any} visit The new visit to add to index; should occur regardless of reidentify outcome.
 */
async function updateIndex(storePageResult, visit, pageId) {
    // If page wasn't stored again, just add new visit
    if (storePageResult == null) {
        return await index.addTimestampConcurrent(
            pageId,
            visitKeyPrefix + visit.visitStart,
        )
    }

    // Wait until all page analyis is done
    const { page } = await storePageResult.finalPagePromise

    // If no page returned from analysis, we can't index
    if (!page) {
        return
    }

    try {
        await index.addPageConcurrent({ pageDoc: page, visitDocs: [visit] })
    } catch (error) {
        // Indexing issue; log it for now
        console.error(error)
        throw error
    }
}

export async function logPageVisit({ tabId, url }) {
    const threshold = 20000

    const { visitTime } = tabManager.getTabState(tabId)

    const pageId = generatePageDocId({ url })
    const existingPage = await index.initSingleLookup()(pageId)

    let storePageResult
    // If there exist the page and the time difference between last index and current timestamp less than {threshold} then we can store the page.
    if (existingPage == null || visitTime - existingPage.latest > threshold) {
        // First create an identifier for the page being visited.
        storePageResult = await storePage({ tabId, url })
    }

    // Create a visit pointing to this page (analysing/storing it may still be in progress)
    const { visit } = await storeVisit({
        page: { _id: pageId },
        url,
        timestamp: visitTime,
    })

    await updateIndex(storePageResult, visit, pageId)

    // TODO possibly deduplicate the visit if the page was deduped too.
    void visit
}

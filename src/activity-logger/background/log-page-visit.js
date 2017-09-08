import db from 'src/pouchdb'
import storePage from 'src/page-storage/store-page'
import { checkWithBlacklist } from 'src/blacklist'
import { generateVisitDocId } from '..'
import * as index from 'src/search/search-index'


// Store the visit in PouchDB.
async function storeVisit({ timestamp, url, page }) {
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
async function updateIndex(finalPagePromise, visit) {
    // Wait until all page analyis is done
    const { page } = await finalPagePromise

    // If no page returned from analysis, we can't index
    if (!page) { return }

    // Queue page and visit to add into search index
    try {
        await index.addPageConcurrent({ pageDoc: page, visitDocs: [visit] })
    } catch (error) {
        console.error(error)
    }
}

export async function logPageVisit({
    tabId,
    url,
}) {
    // First check if we want to log this page (hence the 'maybe' in the name).
    const shouldBeRemembered = await checkWithBlacklist()
    if (!shouldBeRemembered({ url })) {
        return
    }

    // The time to put in documents.
    const timestamp = Date.now()

    // First create an identifier for the page being visited.
    const storePageResult = await storePage({ tabId, url })

    // Create a visit pointing to this page (analysing/storing it may still be in progress)
    const { visit } = await storeVisit({page: storePageResult.page, url, timestamp})

    await updateIndex(storePageResult.finalPagePromise, visit)

    // TODO possibly deduplicate the visit if the page was deduped too.
    void (visit)
}

export async function maybeLogPageVisit({
    tabId,
    url,
}) {
    await logPageVisit({
        tabId,
        url,
    })
}

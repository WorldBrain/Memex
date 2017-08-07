import db from 'src/pouchdb'
import { reidentifyOrStorePage } from 'src/page-storage/store-page'
import { checkWithBlacklist } from 'src/blacklist'
import { generateVisitDocId } from '..'
import * as index from 'src/search/search-index'


// Store the visit in PouchDB.
async function storeVisit({timestamp, url, page}) {
    const visitId = generateVisitDocId({timestamp})
    const visit = {
        _id: visitId,
        visitStart: timestamp,
        url,
        page: {_id: page._id}, // store only a reference to the page
    }
    await db.put(visit)
    return {visit}
}

/**
 * Handles index update, either adding new page + visit, or just adding a visit to existing data.
 *
 * @param {any} reidentifyResult Object containing the existing page/page stub + promise resolving
 *  to the new page (if deduping wasn't successful).
 * @param {any} visit The new visit to add to index; should occur regardless of reidentify outcome.
 */
async function updateIndex({ finalPagePromise, page: existingPage }, visit) {
    // If finalPagePromise exists, it is a new page
    if (finalPagePromise) {
        // Wait until all page analyis/deduping is done before returning.
        const { finalPage } = await finalPagePromise

        if (!finalPage) { return }

        console.time('add-page-to-index time')
        try {
            // Queue page and visit to add into search index
            await index.addPage({ pageDoc: finalPage, visitDocs: [visit] })
            console.log('added new visit and page to index!')
        } catch (error) {
            console.error(error)
        } finally {
            console.timeEnd('add-page-to-index time')
        }
    } else { // It's an existing page
        console.time('add-visit-to-index time')
        try {
            await index.addVisit(visit)
        } catch (error) {
            console.error(error)
        } finally {
            console.timeEnd('add-visit-to-index time')
        }
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

    // TODO first try to extend an existing visit instead of logging a new one.

    // First create an identifier for the page being visited.
    const reidentifyResult = await reidentifyOrStorePage({tabId, url})

    // Create a visit pointing to this page (analysing/storing it may still be in progress)
    const { visit } = await storeVisit({page: reidentifyResult.page, url, timestamp})

    await updateIndex(reidentifyResult, visit)

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

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
    const {page, finalPagePromise} = await reidentifyOrStorePage({tabId, url})
    // Create a visit pointing to this page (analysing/storing it may still be in progress)
    const { visit } = await storeVisit({page, url, timestamp})

    // Wait until all page analyis/deduping is done before returning.
    const { finalPage } = await finalPagePromise

    // Queue page and visit to add into search index
    console.time('add-to-index time')
    index.addPage({ pageDoc: finalPage || {}, visitDocs: [visit] })
        .then(() => {
            console.timeEnd('add-to-index time')
            console.log('added new visit and page to index!')
        })
        .catch(console.error)

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

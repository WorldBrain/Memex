import { findPagesByUrl } from '../../search/find-pages'
import analysePage from '../../page-analysis/background'
import { generatePageDocId } from '..'
import tryDedupePage from './page-deduplication'


async function tryReidentifyPage({page, pageCandidates}) {
    // TODO check ETag or other proof of equality.

    // No match found. We will have to make a new page.
    return undefined
}

async function createPageStub({url}) {
    // Choose the identifier for the page itself.
    const pageId = generatePageDocId()
    const page = {
        _id: pageId,
        url,
    }
    await db.put(page)
    return page
}

async function analyseAndMaybeDedupePage({tabId, page, samePageCandidates}) {
    // Add info to the page object by analysing the document in the tab.
    const {page: analysedPage} = await analysePage({page, tabId})

    // Knowing more about the page now, try find it again in our memory.
    const {finalPage} = await tryDedupePage({page: analysedPage, samePageCandidates})

    // Return the resulting page (likely still the same as analysedPage)
    return {finalPage}
}

export async function reidentifyOrStorePage({tabId, url}) {
    // Find pages we know that had the same URL.
    const samePageCandidates = (await findPagesByUrl({url})).rows.map(row=>row.doc)

    // Check if we can already tell in advance that this is the same page.
    const reusablePage = await tryReidentifyPage({tabId, url, samePageCandidates})

    if (reusablePage) {
        // Equality is known (or assumed) in advance. Reuse the old page as is.
        return {page: reusablePage}
    }
    else {
        // Create a new page object in the database.
        const page = await createPageStub({url})

        // Start analysis and (possibly) deduplication, but do not wait for it.
        const finalPagePromise = analyseAndMaybeDedupePage({
            tabId,
            page,
            samePageCandidates,
        })

        // Return the page stub, and a promise of the analysed & deduped page.
        return {page, finalPagePromise}
    }
}

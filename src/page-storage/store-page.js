import db from 'src/pouchdb'
import { findPagesByUrl } from 'src/search/find-pages'
import { analysePageInTab, fetchPageData } from 'src/page-analysis/background'
import { revisePageFields } from 'src/page-analysis'
import tryDedupePage from './deduplication'
import { generatePageDocId } from '.'


// Try see if we can tell in advance that this page will be one we already know.
// Returns the matching page doc, if any.
async function tryReidentifyPage({ tabId = '', url, samePageCandidates }) {
    // TODO check ETag or other proof of equality.

    // No match found. We will have to make a new page.
    return undefined
}

const createPage = docFields => ({ _id: generatePageDocId(), ...docFields })
const storePage = async page => {
    await db.put(page)
    return page
}

/**
 * @param {string} tabId The ID of the tab to use for analysis
 * @param {PageDoc} page Page to be analysed
 * @param {Array<PageDoc>} samePageCandidates Other page docs considered to be very similar.
 * @returns {PageDoc} Page after analysis and deduping has been applied.
 */
async function analyseAndTryDedupePage({ tabId, page, samePageCandidates }) {
    // Add info to the page doc by analysing the document in the tab.
    const { page: analysedPage } = await analysePageInTab({ page, tabId })

    // Knowing more about the page now, try find it again in our memory.
    const { page: finalPage } = await tryDedupePage({ page: analysedPage, samePageCandidates })

    // Return the resulting page (likely still the same as analysedPage)
    return finalPage
}

// Tries to reidentify the page in tab, or creates a new page doc for it.
// Either way, it returns the page doc. If a new page was created, it starts
// page analysis and then deduplication, and also returns an async function
// (fetchFinalPage) returning the page doc resulting from these steps.
export async function reidentifyOrStorePage({ tabId, url }) {
    // Find pages we know that had the same URL.
    const samePageCandidates = (await findPagesByUrl({ url })).rows.map(row => row.doc)

    // Check if we can already tell in advance that this is the same page.
    const reusablePage = await tryReidentifyPage({ tabId, url, samePageCandidates })

    if (reusablePage) {
        // Equality is known (or assumed) in advance. Reuse the old page as is.
        return { page: reusablePage }
    } else {
        // Create a new page doc stub in the database.
        const page = await storePage(createPage({ url }))

        // Set up fetching function to run anaylsis + fetching logic on-demand
        const fetchFinalPage = () => analyseAndTryDedupePage({ tabId, page, samePageCandidates })

        // Return the page stub, and a function to get the analysed & deduped page.
        return { page, fetchFinalPage }
    }
}

/**
 * Given a URL, attempts to perform all logic needed to store a full page document.
 * @param {string} url The URL to attempt to store a page document for.
 * @returns {any} Page document that was created (or found, if reusable/deduped).
 */
export async function storePageFromUrl({ url }) {
    // Find pages we know that had the same URL.
    const samePageCandidates = (await findPagesByUrl({ url })).rows.map(row => row.doc)

    // Check if we can already tell in advance that this is the same page.
    const reusablePage = await tryReidentifyPage({ url, samePageCandidates })

    // Equality is known (or assumed) in advance. Reuse the old page as is.
    if (reusablePage) {
        return reusablePage
    }

    // Do the data XHR fetch + analyse
    const { text: extractedText, metadata: extractedMetadata, favIcon } = await fetchPageData({ url })

    // Create and store DB page using data, before returning it
    const page = createPage({ url, extractedText, extractedMetadata, favIcon })

    // Store an augmented version of the doc, using data derived from extracted page data
    const augPage = await storePage(revisePageFields(page))

    // Knowing more about the page now, try find it again in our memory
    const { page: finalPage } = await tryDedupePage({ page: augPage, samePageCandidates })

    return finalPage
}

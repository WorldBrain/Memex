import db from 'src/pouchdb'
import analysePage from 'src/page-analysis/background'
import { generatePageDocId } from '.'

/**
 * Given a tabId
 * @param {any} {tabId, url}
 * @returns
 */
export default async function storePage({
    tabId,
    url,
    runAnalysis = true,
    ...pageData
}) {
    const pageDocId = generatePageDocId({ url })
    let pageDoc

    try {
        pageDoc = await db.get(pageDocId)
    } catch (error) {
        // Create a new page doc stub in the database if not found
        if (error.status === 404) {
            pageDoc = { _id: pageDocId, url, ...pageData }
            await db.put(pageDoc)
        } else {
            throw error // Can't handle other errors; throw up stack
        }
    }

    // Start analysis, but do not wait for it.
    const finalPagePromise = runAnalysis
        ? analysePage({ tabId, pageId: pageDoc._id })
        : Promise.resolve()

    // Return the page stub, and a promise of the analysed page.
    return { page: pageDoc, finalPagePromise }
}

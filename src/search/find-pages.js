import update from 'lodash/fp/update'

import db from 'src/pouchdb'
import { revisePageFields } from 'src/page-analysis'


// Post-process result list after any retrieval of pages from the database.
async function postprocessPagesResult({ pagesResult }) {
    // Let the page analysis module augment or revise the document attributes.
    pagesResult = update('rows', rows => rows.map(
        // We can skip those pages that will replaced by a redirect anyway.
        update('doc', doc => doc.seeInstead ? doc : revisePageFields(doc))
    ))(pagesResult)

    return pagesResult
}

export async function getPage({ pageId }) {
    const pagesResult = await getPages({ pageIds: [pageId] })
    return pagesResult.rows[0].doc
}

// Get all pages for a given array of page ids
export async function getPages({ pageIds }) {
    let pagesResult = await db.allDocs({
        keys: pageIds,
        include_docs: true,
    })
    pagesResult = await postprocessPagesResult({ pagesResult })
    return pagesResult
}

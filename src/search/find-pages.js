import get from 'lodash/fp/get'
import update from 'lodash/fp/update'

import db, { normaliseFindResult, resultRowsById } from '../pouchdb'
import { pageKeyPrefix } from '../activity-logger'
import { searchableTextFields, revisePageFields } from '../page-analysis'


// Resolve redirects from (deduplicated) pages, replacing them in the results.
// XXX: We only replace the row.doc, and not row.id, row.key, nor row.value.
async function resolveRedirects(pagesResult) {
    // Get the targets of all docs' 'seeInstead' links.
    const targetPageIds = pagesResult.rows.map(get('doc.seeInstead._id'))
        .filter(x=>x)

    // If these pages contain no redirects, easy job for us.
    if (targetPageIds.length===0) return pagesResult

    // Fetch the targeted pages.
    // Note that multi-step redirections are resolved recursively here.
    // XXX: a cycle of redirections would kill us.
    const targetPagesResult = await getPages({pageIds: targetPageIds})

    // Replace each page doc with its redirection target (if it had any).
    const targetRowsById = resultRowsById(targetPagesResult)
    const resolvedPagesResult = update('rows', rows => rows.map(
        update('doc', doc => (!doc.seeInstead)
            // Leave pages without a 'seeInstead' redirection link untouched...
            ? doc
            // ...and replace the contents of the others with the correct page.
            : {...targetRowsById[doc.seeInstead._id].doc}
        )
    ))(pagesResult)

    return resolvedPagesResult
}

// Post-process result list after any retrieval of pages from the database.
async function postprocessPagesResult(pagesResult) {
    // Let the page analysis module augment or revise the document attributes.
    pagesResult = update('rows', rows => rows.map(
        // We can skip those pages that will replaced by a redirect anyway.
        update('doc', doc => doc.seeInstead ? doc : revisePageFields(doc))
    ))(pagesResult)

    // Resolve pages that redirect to other pages.
    pagesResult = await resolveRedirects(pagesResult)

    return pagesResult
}

const pageSearchIndexParams = {
    filter: doc => (typeof doc._id === 'string'
                    && doc._id.startsWith(pageKeyPrefix)),
    fields: searchableTextFields,
}

// Get all pages for a given array of page ids
export function getPages({pageIds}) {
    return db.allDocs({
        keys: pageIds,
        include_docs: true,
    }).then(
        postprocessPagesResult
    )
}

// Search the log for pages matching given query (keyword) string
export function searchPages({
    query,
    limit,
}) {
    return db.search({
        ...pageSearchIndexParams,
        query,
        limit,
        include_docs: true,
        highlighting: true,
        stale: 'update_after',
    }).then(
        postprocessPagesResult
    )
}

export function updatePageSearchIndex() {
    // Add new documents to the search index.
    return db.search({
        ...pageSearchIndexParams,
        build: true
    })
}

export function findPagesByUrl({url}) {
    return db.find({
        selector: {
            _id: { $gte: pageKeyPrefix, $lte: `${pageKeyPrefix}\uffff`},
            url,
        }
    }).then(
        normaliseFindResult
    ).then(
        postprocessPagesResult
    )
}

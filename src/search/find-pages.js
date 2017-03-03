import update from 'lodash/fp/update'

import db, { keyRangeForPrefix, normaliseFindResult } from '../pouchdb'
import { pageKeyPrefix } from '../activity-logger'
import { searchableTextFields, revisePageFields } from '../page-analysis'


// Post-process result list after any retrieval of pages from the database.
const postprocessPagesResult = update('rows', rows => rows.map(
    // Let the page analysis module augment or revise the document attributes.
    update('doc', revisePageFields)
))

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

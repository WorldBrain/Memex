import update from 'lodash/fp/update'

import db from '../pouchdb'
import { keyRangeForPrefix } from '../pouchdb'
import { pageKeyPrefix } from '../activity-logger'
import { searchableTextFields, revisePageFields } from '../page-analysis'


// Post-process result list after any retrieval of pages from the database.
const postprocessPagesResult = update('rows', rows => rows.map(
    // Let the page analysis module augment or revise the document attributes.
    update('doc', revisePageFields)
))

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
        query,
        filter: doc => (typeof doc._id === 'string'
                        && doc._id.startsWith(pageKeyPrefix)),
        fields: searchableTextFields,
        include_docs: true,
        highlighting: true,
        limit,
        stale: 'update_after',
        ...keyRangeForPrefix(pageKeyPrefix), // Is this supported yet?
    }).then(
        postprocessPagesResult
    )
}

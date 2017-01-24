import docuri from 'docuri'
import orderBy from 'lodash/fp/orderBy'

import db from '../pouchdb'
import { visitKeyPrefix, pageKeyPrefix } from '../activity-logger'
import { searchableTextFields, revisePageFields } from '../page-analysis'

const defaultResultLimit = 30

// The couch/pouch way to match keys with a given a prefix
const keyRangeForPrefix = prefix => ({
    startkey: `${prefix}`,
    endkey: `${prefix}\uffff`
})

// Post-process result list after any retrieval of pages from the database
const mapResultToPages = result => result.rows.map(
    // Let the page analysis module augment or revise the page attributes.
    row => ({...row, doc: revisePageFields(row.doc)})
)

// Get the most recently visited pages from the log
function getLastVisits({
    limit=defaultResultLimit
}={}) {
    return db.find({
        selector: {
            // workaround for startkey/endkey
            _id: { $gt: 'visit/', $lte: 'visit/\uffff'}
        },
        sort: [{_id: 'desc'}],
        limit,
        ...keyRangeForPrefix(visitKeyPrefix), // Is this supported yet?
    }).then(result => {
        // Fetch the page for each visit.
        const pageIds = result.docs.map(doc => doc.page._id)
        return db.allDocs({
            keys: pageIds,
            include_docs: true,
        })
    }).then(mapResultToPages)
}

// Search the log for pages matching given query (keyword) string
function searchPages({
    query,
    limit=defaultResultLimit,
}) {
    return db.search({
        query,
        fields: searchableTextFields,
        include_docs: true,
        highlighting: true,
        limit,
        ...keyRangeForPrefix(pageKeyPrefix), // Is this supported yet?
    }).then(mapResultToPages)
}

// Search by keyword query, returning all docs if no query is given
export function filterByQuery({query}) {
    if (query === '') {
        return getLastVisits()
    }
    else {
        return searchPages({query}).then(
            // Order the results by date of visit, not matching score
            rows => orderBy('doc._id', 'desc')(rows)
        )
    }
}

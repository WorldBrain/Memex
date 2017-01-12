import docuri from 'docuri'
import orderBy from 'lodash/fp/orderBy'

import db from '../pouchdb'

const defaultResultLimit = 30

// The couch/pouch way to match keys with a given a prefix
const keyRangeForPrefix = prefix => ({
    startKey: prefix,
    endKey: prefix + '\uffff'
})

// Get the last N items from the log
function getLog({
    limit=defaultResultLimit
}={}) {
    return db.allDocs({
        include_docs: true,
        descending: true,
        limit,
        ...keyRangeForPrefix('logEntry/'),
    }).then((result) => {
        return result.rows
    }).catch(err => console.error(err))
}

// Search the log for pages matching given query (keyword) string
function searchLog({
    query,
    limit=defaultResultLimit,
}) {
    return db.search({
        query,
        fields: ['title', 'text'],
        include_docs: true,
        highlighting: true,
        limit,
    }).then(
        result => result.rows
    ).catch(
        err => console.error(err)
    )
}

// Search by keyword query, returning all docs if no query is given
export function filterByQuery({query}) {
    if (query === '') {
        return getLog()
    }
    else {
        return searchLog({query}).then(
            // Order the results by date, not matching score
            rows => orderBy('doc._id', 'desc')(rows)
        )
    }
}

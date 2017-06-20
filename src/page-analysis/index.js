// Stuff that is to be accessible from other modules (folders)

// The properties of a page that should be indexed for full-text search.
export const searchableTextFields = [
    'fullText',
    'title',
    'author',
    'description',
    'keywords',
]

// Revise and augment a page doc, used for two possible reasons:
//   1: Rename old fields to the current scheme, without needing data migration.
//   2: Choose the best fields from the available data (doing this at retrieval
//      rather than at storage time gives flexibility).
export const revisePageFields = doc => {
    // No revision needed. Keeping this function still for expected future use.
    return doc
}

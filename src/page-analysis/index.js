// Stuff that is to be accessible from other modules (folders)

// The properties of a page that should be indexed for full-text search.
export const searchableTextFields = [
    'content.fullText',
    'content.title',
    'content.author',
    'content.description',
    'content.keywords',
    'url',
]

// Revise and augment a page doc, used for two possible reasons:
//   1: Rename old fields to the current scheme, without needing data migration.
//   2: Choose the best fields from the available data (doing this at retrieval
//      rather than at storage time gives flexibility).
export const revisePageFields = doc => ({
    ...doc,
    // Choose a name to display; use the extracted title if available.
    title: (doc.content && doc.content.title) || '',
})

// Stuff that is to be accessible from other modules (folders)

// The properties of a page that should be indexed for full-text search.
export const searchableTextFields = [
    'title',
    'extractedMetadata.title',
    'extractedText.excerpt',
    'extractedText.textContent',
    'extractedText.bodyInnerText',
]

// Revise and augment a page doc using available fields from the extracted data.
// (done at retrieval rather than at storage time for the sake of flexibility)
export const revisePageFields = doc => ({
    ...doc,
    // Choose something presentable as a title.
    title: (doc.extractedMetadata && doc.extractedMetadata.title)
    || doc.title
    || doc.url,
})

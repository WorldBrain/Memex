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
export const revisePageFields = doc => ({
    ...doc,
    fullText: (
        doc.fullText
        || (doc.extractedText && doc.extractedText.bodyInnerText) // old format
        || undefined
    ),
    title: (
        doc.title
        || (doc.extractedMetadata && doc.extractedMetadata.title) // old format
        || (doc.extractedMetadata && doc.extractedMetadata.Title) // old format for PDFs
        || undefined
    ),
    author: (
        doc.author
        || (doc.extractedMetadata && doc.extractedMetadata.author) // old format
        || (doc.extractedMetadata && doc.extractedMetadata.Author) // old format for PDFs
        || undefined
    ),
    keywords: (
        doc.keywords
        || (doc.extractedMetadata && doc.extractedMetadata.Keywords) // old format for PDFs
        || undefined
    ),
})

import stream from 'stream'
import reduce from 'lodash/fp/reduce'

import transformPageText from 'src/util/transform-page-text'

const combineContentStrings = reduce((result, val) => `${result}\n${val}`, '')

/**
 * Transforms a page doc to doc structured for use with the index.
 * All searchable page data (content) is concatted to make a composite field.
 * This represents the general structure for index docs.
*/
const transformPageDoc = ({ _id: id, content = {}, bookmarkTimestamps = [], visitTimestamps = [] }) => ({
    id,
    content: combineContentStrings(content),
    bookmarkTimestamps,
    visitTimestamps,
})

// Transform stream version (currently not supported by concurrentAdd) TODO
export class PipelineStream extends stream.Transform {
    _transform(doc, _, next) {
        const transformedDoc = transformPageDoc(doc)
        const { text: transformedContent } = transformPageText({ text: transformedDoc.content })

        next(null, {
            ...transformedDoc,
            content: transformedContent,
        })
    }
}

/**
 * Function version of "pipeline" logic. Applies transformation logic
 * on a given doc.
 *
 * @param {any} doc A page doc containing `content` field containing various webpage data + `_id`.
 * @returns {any} Doc ready for indexing containing `id` and processed composite `content` string field
 */
export default function pipeline({ _id: id, content }) {
    // Short circuit if no searchable content
    //  (not 100% sure what to do here yet; basically means doc is useless for search)
    if (!content || Object.keys(content).length === 0) {
        return { id }
    }

    // This is the main searchable page content. The bulk is from `document.body.innerText` in
    //  `content.fullText`. Contains other things like `content.title`, `content.description`.
    //  Here we are just concatting it all, essentially making a composite field for text search.
    const searchableContent = combineContentStrings(content)

    const { text: transformedContent } = transformPageText({ text: searchableContent })

    return { id, content: transformedContent }
}

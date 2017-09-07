import stream from 'stream'
import reduce from 'lodash/fp/reduce'

import transformPageText from 'src/util/transform-page-text'

const combineContentStrings = reduce((result, val) => `${result}\n${val}`, '')

/**
 * Transforms a page doc to doc structured for use with the index.
 * All searchable page data (content) is concatted to make a composite field.
 * This represents the general structure for index docs.
*/
const transformPageDoc = ({ _id: id, content = {}, bookmarks = [], visits = [] }) => ({
    id,
    content: combineContentStrings(content),
    bookmarks,
    visits,
})

// Currently just removes the protocol (and opt. 'www.') from URLs, to enable easy search-on-domain matching
const transformUrl = url => url.replace(/(^\w+:|^)\/\/(www\.)?/, '')

// Transform stream version (currently not supported by concurrentAdd, hence is currently unused)
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
export default function pipeline({ _id: id, content, url }) {
    // First apply transformations to the URL
    const transformedUrl = transformUrl(url)

    // Short circuit if no searchable content
    //  (not 100% sure what to do here yet; basically means doc is useless for search)
    if (!content || Object.keys(content).length === 0) {
        return { id, url: transformedUrl }
    }

    // This is the main searchable page content. The bulk is from `document.body.innerHTML` in
    //  `content.fullText`. Contains other things like `content.title`, `content.description`.
    //  Here we are just concatting it all, essentially making a composite field for text search.
    const searchableContent = combineContentStrings(content)

    // Run the searchable content through our text transformations, attempting to discard useless data.
    const { text: transformedContent } = transformPageText({ text: searchableContent })

    return { id, content: transformedContent, url: transformedUrl }
}

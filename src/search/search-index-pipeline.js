import stream from 'stream'
import reduce from 'lodash/fp/reduce'

const allWhitespacesPattern = /\s+/g
const negateNonWordsPattern = /[^_\W]+/g // NOTE: This kills accented characters
const numbersPattern = /[0-9]+/g
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

const removePunctuation = (text = '') =>
    text.match(negateNonWordsPattern).join(' ')

const removeNumbers = (text = '') =>
    text.replace(numbersPattern, '')

const cleanupWhitespaces = (text = '') =>
    text.replace(allWhitespacesPattern, ' ').trim()

// Transform stream version (currently not supported by concurrentAdd)
export class PipelineStream extends stream.Transform {
    _transform(doc, _, next) {
        const transformedDoc = transformPageDoc(doc)

        next(null, transformedDoc)
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

    /* DEBUG */
    console.time('pre-process content')

    // This is the main searchable page content. The bulk is from `document.body.innerText` in
    //  `content.fullText`. Contains other things like `content.title`, `content.description`.
    //  Here we are just concatting it all, essentially making a composite field for text search.
    let searchableContent = combineContentStrings(content)

    /* DEBUG */
    const lengthBefore = searchableContent.length
    console.log('length before: ', lengthBefore)

    // We don't care about non-single-space whitespace (other than ' ') -- this may not be needed --
    searchableContent = cleanupWhitespaces(searchableContent)

    // We don't care about searching on punctuation, so remove that
    searchableContent = removePunctuation(searchableContent)

    // We don't care about numbers
    searchableContent = removeNumbers(searchableContent)

    /* DEBUG */
    const lengthAfter = searchableContent.length
    console.log('length after: ', lengthAfter)
    console.log('savings: ', lengthAfter/lengthBefore * 100)
    console.timeEnd('pre-process content')

    return { id, content: searchableContent }
}

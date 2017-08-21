const allWhitespacesPattern = /\s+/g
const nonWordsPattern = /[_\W]+/g // NOTE: This kills accented characters; maybe make better
const numbersPattern = /[0-9]+/g


const removePunctuation = (text = '') =>
    text.replace(nonWordsPattern, ' ')

const removeNumbers = (text = '') =>
    text.replace(numbersPattern, ' ')

const cleanupWhitespaces = (text = '') =>
    text.replace(allWhitespacesPattern, ' ').trim()

/**
 * Takes in some text content and strips it of unneeded data. Currently does
 * puncation (although includes accented characters), numbers, and whitespace.
 * TODO: pass in options to disable certain functionality.
 *
 * @param {any} content A content string to transform.
 * @returns {any} Object containing the transformed `content` + less important
 *  `lengthBefore`, `lengthAfter` stats.
 */
export default function transform({ text = '' }) {
    // Short circuit if no text
    if (!text || !text.replace(/\s/g, '')) {
        return text
    }

    let searchableText = text

    const lengthBefore = searchableText.length

    // We don't care about searching on punctuation, so remove that
    searchableText = removePunctuation(searchableText)

    // We don't care about numbers
    searchableText = removeNumbers(searchableText)

    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)

    const lengthAfter = searchableText.length

    return { text: searchableText, lengthBefore, lengthAfter }
}

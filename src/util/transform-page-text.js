import urlRegex from 'url-regex' // Check https://mathiasbynens.be/demo/url-regex for results RE: this pattern
import sw from 'remove-stopwords'
import rmDiacritics from './remove-diacritics'

const allWhitespacesPattern = /\s+/g
// const singleDigitNumbersPattern = /\b\d\b/g
const nonWordsPattern = /[\u2000-\u206F\u2E00-\u2E7F\\!"#$%&()*+,./:;<=>?@[\]^_`{|}~«»。（）ㅇ©ºø°]/gi
const apostrophePattern = /['’]/g
const allWordsWithDigits = /[a-z]+\d\w*|\w*\d[a-z]+/gi // /\w*\d\w*/g
const dashPattern = /[-]/g
const giberishWords = /\S*([b-df-hj-np-tv-z]){5,}\S*/gi
const longWords = /\b\w{20,}\b/gi
const randomDigits = /\b(\d{1,3}|\d{5,})\b/gi
const urlPattern = urlRegex()

const removeUrls = (text = '') => text.replace(urlPattern, ' ')

const removePunctuation = (text = '') => text.replace(nonWordsPattern, ' ')

const cleanupWhitespaces = (text = '') =>
    text.replace(allWhitespacesPattern, ' ').trim()

/**
 * Split string into strings of words, then remove duplicates (using `Set` constructor).
 *
 * @param {string} [text=''] Input string
 * @param {string|RegExp} [wordDelim=' '] Delimiter to split `input` into words.
 * @returns {string} Version of `text` param without duplicate words.
 */
export const removeDupeWords = (text = '', wordDelim = ' ') =>
    [...new Set(text.split(wordDelim))].join(wordDelim)

const removeUselessWords = (text = '', lang) => {
    const oldString = text.split(' ')
    const newString = sw.removeStopwords(oldString, lang)
    return newString.join(' ')
}

const combinePunctuation = (text = '') => text.replace(apostrophePattern, '')

const splitPunctuation = (text = '') => text.replace(dashPattern, ' ')

const removeDiacritics = (text = '') => {
    return rmDiacritics(text)
}

// This also removes any numbers greater than 5 chars
const removeAllWordsWithDigits = (text = '') =>
    text.replace(allWordsWithDigits, ' ')

const removeRandomDigits = (text = '') => text.replace(randomDigits, ' ')

const removeLongWords = (text = '') => text.replace(longWords, ' ')

const removeGiberishWords = (text = '') => text.replace(giberishWords, ' ')

/**
 * Takes in some text content and strips it of unneeded data. Currently does
 * puncation (although includes accented characters), numbers, and whitespace.
 * TODO: pass in options to disable certain functionality.
 *
 * @param {any} content A content string to transform.
 * @returns {any} Object containing the transformed `content` + less important
 *  `lengthBefore`, `lengthAfter` stats.
 */
export default function transform({ text = '', lang = 'en' }) {
    // Short circuit if no text
    if (!text || !text.replace(/\s/g, '')) {
        return text
    }
    let searchableText = text
    const lengthBefore = searchableText.length

    // Remove URLs first before we start messing with things
    searchableText = removeUrls(searchableText)

    // Removes ' from words effectively combining them
    // Example O'Grady => OGrady
    searchableText = combinePunctuation(searchableText)

    // Splits words with - into two separate words
    // Example "chevron-right", "chevron right"
    searchableText = splitPunctuation(searchableText)

    // Changes accented characters to regular letters
    searchableText = removeDiacritics(searchableText)

    searchableText = removePunctuation(searchableText)

    // Removes 'stopwords' such as they'll, don't, however ect..
    searchableText = removeUselessWords(searchableText, lang)

    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)

    // Remove all words containing numbers ex. blah123
    searchableText = removeAllWordsWithDigits(searchableText)

    // Removes all single digits and digits over 5+ characters
    searchableText = removeRandomDigits(searchableText)

    // Removes all words 20+ characters long
    searchableText = removeLongWords(searchableText)

    // Removes all words containing 4+ consonants such as "hellllo"
    searchableText = removeGiberishWords(searchableText)

    searchableText = removeDupeWords(searchableText)

    const lengthAfter = searchableText.length

    return { text: searchableText, lengthBefore, lengthAfter }
}

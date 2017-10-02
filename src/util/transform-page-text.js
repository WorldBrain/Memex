import urlRegex from 'url-regex' // Check https://mathiasbynens.be/demo/url-regex for results RE: this pattern
import sw from 'remove-stopwords'
import rmDiacritics from './remove-diacritics'

const allWhitespacesPattern = /\s+/g
// const singleDigitNumbersPattern = /\b\d\b/g
const nonWordsPattern = /[_\W]+/g
const apostropheDashPattern = /[-'’]/g
const allWordsWithDigits = /((\b(\d{6,})\b)|([a-z]+\d\w*|\w*\d[a-z]+))\s*/gi  // /\w*\d\w*/g

const urlPattern = urlRegex()

const removeUrls = (text = '') =>
    text.replace(urlPattern, ' ')

const removePunctuation = (text = '') =>
    text.replace(nonWordsPattern, ' ')

const cleanupWhitespaces = (text = '') =>
    text.replace(allWhitespacesPattern, ' ').trim()

// Split strings on non-words, filtering out duplicates, before rejoining them with single space
const removeDuplicateWords = (text = '') =>
    text.split(/\W+/)
        .filter((word, i, allWords) => i === allWords.indexOf(word))
        .join(' ')

const removeUselessWords = (text = '', lang) => {
    const oldString = text.split(' ')
    const newString = sw.removeStopwords(oldString, lang)
    return newString.join(' ')
}

const combinePunctuation = (text = '') =>
    text.replace(apostropheDashPattern, '')

const removeDiacritics = (text = '') => {
    return rmDiacritics(text)
}

// This also removes any numbers greater than 5 chars
const removeAllWordsWithDigits = (text = '') =>
    text.replace(allWordsWithDigits, ' ')

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

    // console.log( text + "transform-text" + lang)
    let searchableText = text
    const lengthBefore = searchableText.length

    // Remove URLs first before we start messing with things
    // console.log('beginning: \n',searchableText)
    searchableText = removeUrls(searchableText)

    // Removes ' and - from words effectively combining them
    // Example e-mail => email, O'Grady => OGrady
    searchableText = combinePunctuation(searchableText)

    // Changes accented characters to regular letters
    searchableText = removeDiacritics(searchableText)

    searchableText = removePunctuation(searchableText)

    // Removes 'stopwords' such as they'll, don't, however ect..
    searchableText = removeUselessWords(searchableText, lang)

    // searchableText = removeSingleDigitNumbers(searchableText)

    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)

    // Remove all numbers and all words containing numbers
    searchableText = removeAllWordsWithDigits(searchableText)

    searchableText = removeDuplicateWords(searchableText)

    const lengthAfter = searchableText.length

    return { text: searchableText, lengthBefore, lengthAfter }
}

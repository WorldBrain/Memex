import urlRegex from 'url-regex'
import nlp from 'compromise'
import sw from 'stopword'
// Check https://mathiasbynens.be/demo/url-regex for results RE: this pattern

const allWhitespacesPattern = /\s+/g
const nonWordsPattern = /[_\W]+/g // NOTE: This kills accented characters; maybe make better
const singleDigitNumbersPattern = /\b\d\b/g
const smallWordsPattern = /(\b(\w{1,3})\b(\s|$))/g
const urlPattern = urlRegex()

const removeUrls = (text = '') =>
    text.replace(urlPattern, ' ')

const removePunctuation = (text = '') =>
    text.replace(nonWordsPattern, ' ')

// Removes any single digit numbers that appear on their own
const removeSingleDigitNumbers = (text = '') =>
    text.replace(singleDigitNumbersPattern, ' ')

const cleanupWhitespaces = (text = '') =>
    text.replace(allWhitespacesPattern, ' ').trim()

// Removes any words with <= 3 chars
const removeSmallWords = (text = '') =>
    text.replace(smallWordsPattern, '')

// Split strings on non-words, filtering out duplicates, before rejoining them with single space
const removeDuplicateWords = (text = '') =>
    text.split(/\W+/)
        .filter((word, i, allWords) => i === allWords.indexOf(word))
        .join(' ')

const findUsefullWords = (text = '') => {
    var t = nlp(text)
    var usefullwords = (t.nouns().out('text') + t.verbs().out('text'))
    return (usefullwords)
}

const removeUselessWords = (text = '') => {
    var oldString = text.split(' ')
    var newString = sw.removeStopwords(oldString)
    return (newString.join(' '))
}
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
    console.time("transform-text")
    let searchableText = text
    
    
    // We only care about 'usefull words'
    const lengthBefore = searchableText.length
    // console.time('compromise')
    

    // searchableText = findUsefullWords(searchableText)
    

    // console.timeEnd('compromise')

    // console.log(searchableText)
    
    // console.log('lengthbefore' + lengthBefore)
    // console.log('lengthafter' + lengthAfter)
    

    // Remove URLs first before we start messing with things
    searchableText = removeUrls(searchableText)
    
    searchableText = removeSmallWords(searchableText)
    
    searchableText = removeDuplicateWords(searchableText)
    
    // We don't care about searching on punctuation, so remove that
    searchableText = removePunctuation(searchableText)
   
    // We don't care single digit numbers
    searchableText = removeSingleDigitNumbers(searchableText)
    
    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)

    // searchableText = removeUselessWords(searchableText)
    
    const lengthAfter = searchableText.length
    console.timeEnd("transform-text")
    return { text: searchableText, lengthBefore, lengthAfter }
}

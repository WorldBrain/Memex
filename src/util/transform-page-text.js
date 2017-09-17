import urlRegex from 'url-regex' // Check https://mathiasbynens.be/demo/url-regex for results RE: this pattern
import nlp from 'compromise'
import sw from 'remove-stopwords'
import rmDiacritics from './remove-diacritics'


const allWhitespacesPattern = /\s+/g
const nonWordsPattern = /[_\W]+/g // NOTE: This kills accented characters; maybe make better
const singleDigitNumbersPattern = /\b\d\b/g
const smallWordsPattern = /(\b(\w{1,2})\b(\s|$))/g
const apostropheDashPattern = /[\-\'\’]/g
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

// Removes any words with <= 2 chars
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

const combinePunctuation = (text = '') =>
    text.replace(apostropheDashPattern, '')

const removeDiacritics = (text = '') => {
    return (rmDiacritics(text))
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
    
    console.time("transform-text-time")
    let searchableText = text
    var lengthBefore = searchableText.length

  /*    // This is the block of code to run nlp compromise 
    console.time('compromise')
    
    searchableText = findUsefullWords(searchableText)
    
    console.timeEnd('compromise') */


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
    searchableText = removeUselessWords(searchableText)
    

    // Removes words <= 2 chars
    searchableText = removeSmallWords(searchableText)

    searchableText = removeSingleDigitNumbers(searchableText)
   
    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)
   
    searchableText = removeDuplicateWords(searchableText)
    
    var lengthAfter = searchableText.length
    console.log('total chars removed: ', (lengthBefore - lengthAfter))
    console.timeEnd("transform-text-time")
    console.log('text after pipeline: \n' ,searchableText)

    
    return { text: searchableText, lengthBefore, lengthAfter }
}

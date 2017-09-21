import urlRegex from 'url-regex' // Check https://mathiasbynens.be/demo/url-regex for results RE: this pattern
import sw from 'remove-stopwords'
import rmDiacritics from './remove-diacritics'
import snowball from 'snowball'
import isoConv from 'iso-language-converter'

const allWhitespacesPattern = /\s+/g
const nonWordsPattern = /[_\W]+/g // NOTE: This kills accented characters; maybe make better
const singleDigitNumbersPattern = /\b\d\b/g
const smallWordsPattern = /(\b(\w{1,2})\b(\s|$))/g
const apostropheDashPattern = /[\-\'\’]/g
const allWordsWithDigits = /((\b(\d{1,3}|\d{5,})\b)|([a-z]+\d\w*|\w*\d[a-z]+))\s*/gi  // /\w*\d\w*/g
const plurals = /s\b/g

const urlPattern = urlRegex() 

const removeUrls = (text = '') =>
    text.replace(urlPattern, ' ')

const removePunctuation = (text = '') =>
    text.replace(nonWordsPattern, ' ')

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

const removeUselessWords = (text = '', lang) => {
    var oldString = text.split(' ')   
    var newString = sw.removeStopwords(oldString, sw.lang)
    return (newString.join(' '))
}

const combinePunctuation = (text = '') =>
    text.replace(apostropheDashPattern, '')

const removeDiacritics = (text = '') => {
    return (rmDiacritics(text))
}

const removeAllWordsWithDigits = (text = '') => 
    text.replace(allWordsWithDigits, ' ')

const stemText = (text, lang) => {
    var stemmer = new snowball(lang)
    
    var stemmedText = textArray.map(function(word) {
        stemmer.setCurrent(word)
        stemmer.stem()
        return stemmer.getCurrent()
    })
    return (stemmedText.join(' '))
}

const stemAllLanguages = (text) => {
    // These are the languages snowball supports.
    allLanguages = ['english', 'danish', 'dutch', 'finnish', 'french', 'german', 'hungarian', 
    'italian', 'norwegian', 'portuguese', 'russian', 'spansish', 'swedish', 'romanian', 'turkish' ]

    wordsToKeep = text
    //Iterate over each language and keep array if there are any changes.
    allLanguages.map(function(lang) {
       wordsToKeep.map(function(word) {
        var maybeKeepWord = stemText([word], lang)
        
        if (maybeKeepWord != word) {
            wordsToKeep[word].replace(maybeKeepWord)
        }
       }) 
       
       stemmedText = maybeKeepText != wordsToKeep ? maybeKeepText : wordsToKeep
    })
    return (wordsToKeep)
} 

const stemWords = (text = '', lang) => {
    var wordsToKeep = text.split(' ')
    if (lang === 'all') {
        return (stemAllLanguages(text))
    }
    // snowball requires the language in readable text i.e. 'English' instead of 'en'
    var newLang = isoConv(lang)

    return (stemText(text, newLang))
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


export default function transform({ text = '', lang}) {
    // Short circuit if no text
    if (!text || !text.replace(/\s/g, '')) {
        return text
    }

    //Check if there is a language else default to english
    lang = !lang ? 'en' : lang

    console.log("transfor-text " + lang)
    console.time("transform-text-time")
    let searchableText = text
    var lengthBefore = searchableText.length

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
    
    // Removes words <= 2 chars
    searchableText = removeSmallWords(searchableText)

    // searchableText = removeSingleDigitNumbers(searchableText)
    
    // We don't care about non-single-space whitespace (' ' is cool)
    searchableText = cleanupWhitespaces(searchableText)

    // Remove all numbers and all words containing numbers 
    searchableText = removeAllWordsWithDigits(searchableText)

    searchableText = removeDuplicateWords(searchableText)
    
    // Stemming removes things like 'ly' from ends of words and reduces size overall
    searchableText = stemWords('absolutely', lang)
    
    var lengthAfter = searchableText.length
 /*    var numberOfWords = searchableText.split(' ').length
    console.log(numberOfWords)
    console.log('total chars removed: ', (lengthBefore - lengthAfter)) */
    console.timeEnd("transform-text-time")
    // console.log('text after pipeline: \n' ,searchableText)

    
    return { text: searchableText, lengthBefore, lengthAfter }
}

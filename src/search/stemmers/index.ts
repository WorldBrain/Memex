import { StemmerSelector } from '@worldbrain/storex-backend-dexie'
import textStemmer from '@worldbrain/memex-stemmer'

import urlStemmer from './url-stemmer'

const selector: StemmerSelector = args => {
    switch (args.collectionName) {
        case 'pages':
            return pages(args)
        case 'annotations':
        default:
            return annotations(args)
    }
}

const pages: StemmerSelector = args => {
    switch (args.fieldName) {
        case 'fullUrl':
            return urlStemmer
        case 'fullTitle':
        case 'text':
        default:
            return textStemmer
    }
}

const annotations: StemmerSelector = args => {
    switch (args.fieldName) {
        case 'pageTitle':
        case 'comment':
        case 'body':
        default:
            return textStemmer
    }
}

export default selector

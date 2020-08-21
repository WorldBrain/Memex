import { metadataRuleSets } from 'page-metadata-parser'

/**
 * Collection of fathom rules to tell `page-metadata-parser` where to extract certain metadata from
 */

// We only want to fallback to the opengraph URL
const canonicalUrl = {
    ...metadataRuleSets.url,
    defaultValue: undefined,
    rules: [
        ['link[rel="canonical"]', (element) => element.getAttribute('href')],
        [
            'meta[property="og:url"]',
            (element) => element.getAttribute('content'),
        ],
    ],
}

// We mainly want whatever the browser-facing title is, which can change - OG tags don't need to change
const title = {
    rules: [
        ['title', (element) => element.text],
        [
            'meta[property="og:title"]',
            (element) => element.getAttribute('content'),
        ],
    ],
}

export default {
    canonicalUrl,
    title,
    keywords: metadataRuleSets.keywords,
    description: metadataRuleSets.description,
}

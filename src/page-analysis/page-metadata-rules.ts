import { metadataRules } from 'page-metadata-parser'

/**
 * Collection of fathom rules to tell `page-metadata-parser` where to extract certain metadata from
 */

// We only want to fallback to the opengraph URL
const canonicalUrl = {
    ...metadataRules.url,
    rules: [
        ['link[rel="canonical"]', node => node.element.getAttribute('href')],
        [
            'meta[property="og:url"]',
            node => node.element.getAttribute('content'),
        ],
    ],
}

// We mainly want whatever the browser-facing title is, which can change - OG tags don't need to change
const title = {
    rules: [
        ['title', node => node.element.text],
        [
            'meta[property="og:title"]',
            node => node.element.getAttribute('content'),
        ],
    ],
}

export default {
    canonicalUrl,
    title,
    keywords: metadataRules.keywords,
    description: metadataRules.description,
}

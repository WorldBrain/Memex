import { CollectionDefinitionMap } from 'storex'

// TODO: move these declarations to own feature storage classes
export default {
    pages: {
        version: new Date(2018, 1, 1),
        fields: {
            url: { type: 'string' },
            fullUrl: { type: 'text' },
            fullTitle: { type: 'text' },
            text: { type: 'text' },
            domain: { type: 'string' },
            hostname: { type: 'string' },
            screenshot: { type: 'media' },
            lang: { type: 'string' },
            canonicalUrl: { type: 'url' },
            description: { type: 'text' },
        },
        indices: [
            { field: 'url', pk: true },
            { field: 'text', fullTextIndexName: 'terms' },
            { field: 'fullTitle', fullTextIndexName: 'titleTerms' },
            { field: 'fullUrl', fullTextIndexName: 'urlTerms' },
            { field: 'domain' },
            { field: 'hostname' },
        ],
    },
    visits: {
        version: new Date(2018, 1, 1),
        fields: {
            url: { type: 'string' },
            time: { type: 'timestamp' },
            duration: { type: 'int' },
            scrollMaxPerc: { type: 'float' },
            scrollMaxPx: { type: 'float' },
            scrollPerc: { type: 'float' },
            scrollPx: { type: 'float' },
        },
        indices: [{ field: ['time', 'url'], pk: true }, { field: 'url' }],
    },
    bookmarks: {
        version: new Date(2018, 1, 1),
        fields: {
            url: { type: 'string' },
            time: { type: 'timestamp' },
        },
        indices: [{ field: 'url', pk: true }, { field: 'time' }],
    },
    tags: {
        version: new Date(2018, 1, 1),
        fields: {
            url: { type: 'string' },
            name: { type: 'string' },
        },
        indices: [
            { field: ['name', 'url'], pk: true },
            { field: 'name' },
            { field: 'url' },
        ],
    },
    favIcons: {
        version: new Date(2018, 1, 1),
        fields: {
            hostname: { type: 'string' },
            favIcon: { type: 'media' },
        },
        indices: [{ field: 'hostname', pk: true }],
    },
} as CollectionDefinitionMap

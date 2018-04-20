export const EXPECTED_TERMS = [
    'people',
    'forget',
    'optimize',
    'important',
    'code',
]

export const PAGE_1 = {
    url: 'https://www.test.com/test',
    content: {
        fullText: 'the wild fox jumped over the hairy red hen',
        title: 'test page',
    },
}

export const EXPECTED_OUTPUT_NEW = {
    domain: 'test.com',
    fullTitle: PAGE_1.content.title,
    fullUrl: PAGE_1.url,
    text: PAGE_1.content.fullText,
    tags: [],
    terms: ['wild', 'fox', 'jumped', 'hairy', 'red', 'hen'],
    urlTerms: ['test'],
}

export const EXPECTED_OUTPUT_OLD = {
    terms: new Set([
        'term/wild',
        'term/fox',
        'term/jumped',
        'term/hairy',
        'term/red',
        'term/hen',
    ]),
    urlTerms: new Set(['url/test']),
    titleTerms: new Set(['title/test', 'title/page']),
    domain: 'domain/test.com',
    visits: new Set(['visit/12345']),
    bookmarks: new Set(),
    tags: new Set(),
}

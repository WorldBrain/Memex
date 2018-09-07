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

export const EXPECTED_OUTPUT = {
    domain: 'test.com',
    fullTitle: PAGE_1.content.title,
    fullUrl: PAGE_1.url,
    text: PAGE_1.content.fullText,
    tags: [],
    terms: ['wild', 'fox', 'jumped', 'hairy', 'red', 'hen'],
    urlTerms: ['test'],
}

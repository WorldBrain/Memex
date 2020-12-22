import { SearchQueryParsed } from '../types'

// const testStrings = [
//     't:',
//     `d:domain`,
//     `search`,
//     `search term`,
//     `c:list `,
//     `t:tag`,
//     `from:"date"`,
//     `to:"date"`,
//     ``,
//     `t:foo foo bar foo bar`,
//     `bar t:foo,bar,"foo bar" foo`,
//     `foo from:"date" to:"other date" bar`,
//     `foo t:tag,"other tag" c:list,"other list"`,
//     `foo t:tag,"other tag" c:list,"other `,
//     `foo t:tag bar d:foo.com,foobar.com foobar`,
// ]

interface TestData {
    testString: string
    expected: SearchQueryParsed
}

const testData: TestData[] = [
    {
        testString: `t:`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: [],
                },
            },
        ],
    },
    {
        testString: `d:domain`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'domainsIncluded',
                    filters: ['domain'],
                },
            },
        ],
    },
    {
        testString: `search`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'search' },
            },
        ],
    },
    {
        testString: `search term`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'search term' },
            },
        ],
    },
    {
        testString: `c:list`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'listsIncluded',
                    filters: ['list'],
                },
            },
        ],
    },
    {
        testString: `t:tag`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['tag'],
                },
            },
        ],
    },
    {
        testString: `from:"date"`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'dateFrom',
                    filters: ['date'],
                },
            },
        ],
    },
    {
        testString: `to:"date"`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'dateTo',
                    filters: ['date'],
                },
            },
        ],
    },
    {
        testString: ``,
        expected: [],
    },
    {
        testString: `t:foo foo bar foo bar`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['foo'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'foo bar foo bar' },
            },
        ],
    },
    {
        testString: `bar t:foo,bar,"foo bar" foo`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'bar' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['foo', 'bar', 'foo bar'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
        ],
    },
    {
        testString: `foo from:"date" to:"other date" bar`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'dateFrom',
                    filters: ['date'],
                },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'dateTo',
                    filters: ['other date'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'bar' },
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag" c:list,"other list"`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['tag', 'other tag'],
                },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'listsIncluded',
                    filters: ['list', 'other list'],
                },
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag" c:list,"other `,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['tag', 'other tag'],
                },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'listsIncluded',
                    filters: ['list'],
                },
            },
        ],
    },
    {
        testString: `foo t:tag bar d:foo.com,foobar.com foobar`,
        expected: [
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['tag'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'bar' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'domainsIncluded',
                    filters: ['foo.com', 'foobar.com'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'foobar' },
            },
        ],
    },
]

export default testData

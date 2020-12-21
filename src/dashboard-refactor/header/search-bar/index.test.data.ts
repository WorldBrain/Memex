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
                type: 'search terms',
                detail: 'search',
            },
        ],
    },
    {
        testString: `search term`,
        expected: [
            {
                type: 'search terms',
                detail: 'search term',
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
        testString: `bar t:foo,bar,"foo bar" foo`,
        expected: [
            {
                type: 'search terms',
                detail: 'bar',
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['foo', 'bar', 'foo bar'],
                },
            },
            {
                type: 'search terms',
                detail: 'foo',
            },
        ],
    },
    {
        testString: `foo from:"date" to:"other date" bar`,
        expected: [
            {
                type: 'search terms',
                detail: 'foo',
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
                type: 'search terms',
                detail: 'bar',
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag" c:list,"other list"`,
        expected: [
            {
                type: 'search terms',
                detail: 'foo',
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
                type: 'search terms',
                detail: 'foo',
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
                type: 'search terms',
                detail: 'foo',
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['tag'],
                },
            },
            {
                type: 'search terms',
                detail: 'bar',
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'domainsIncluded',
                    filters: ['foo.com', 'foobar.com'],
                },
            },
            {
                type: 'search terms',
                detail: 'foobar',
            },
        ],
    },
]

export default testData

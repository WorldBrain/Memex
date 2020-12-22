import { SearchQueryParsed, SearchFilterDetail } from '../types'

// const newFilterObjs = [
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
    newFilterObj: SearchFilterDetail
    oldQueryArray: SearchQueryParsed
    newQueryArray: SearchQueryParsed
}

const testData: TestData[] = [
    {
        newFilterObj: {
            filterType: 'tagsIncluded',
            filters: [],
        },
        oldQueryArray: [],
        newQueryArray: [
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
        newFilterObj: {
            filterType: 'domainsIncluded',
            filters: ['domain'],
        },
        oldQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'domainsIncluded',
                    filters: [],
                },
            },
        ],
        newQueryArray: [
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
        newFilterObj: {
            filterType: 'dateFrom',
            filters: ['date'],
        },
        oldQueryArray: [
            {
                type: 'searchTerms',
                detail: { value: 'search' },
            },
        ],
        newQueryArray: [
            {
                type: 'searchTerms',
                detail: { value: 'search' },
            },
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
        newFilterObj: {
            filterType: 'listsIncluded',
            filters: ['other lists'],
        },
        oldQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'listsIncluded',
                    filters: ['list'],
                },
            },
        ],
        newQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'listsIncluded',
                    filters: ['list', 'other lists'],
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'dateTo',
            filters: ['date'],
        },
        oldQueryArray: [],
        newQueryArray: [
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
        newFilterObj: {
            filterType: 'tagsIncluded',
            filters: ['foo bar'],
        },
        oldQueryArray: [
            {
                type: 'searchTerms',
                detail: { value: 'bar' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tagsIncluded',
                    filters: ['foo', 'bar'],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'foo' },
            },
        ],
        newQueryArray: [
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
        newFilterObj: {
            filterType: 'dateTo',
            filters: ['other date'],
        },
        oldQueryArray: [
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
                    filters: [],
                },
            },
            {
                type: 'searchTerms',
                detail: { value: 'bar' },
            },
        ],
        newQueryArray: [
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
        newFilterObj: {
            filterType: 'listsIncluded',
            filters: ['better list'],
        },
        oldQueryArray: [
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
            {
                type: 'filterFragment',
                detail: { value: '"other' },
            },
            {
                type: 'trailingWhitespace',
            },
        ],
        newQueryArray: [
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
                    filters: ['list', 'better list'],
                },
            },
            {
                type: 'filterFragment',
                detail: { value: '"other' },
            },
            {
                type: 'trailingWhitespace',
            },
        ],
    },
]

export default testData

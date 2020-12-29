import { SearchFilterDetail, SearchQueryPart } from '../types'

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
    oldQueryArray: SearchQueryPart[]
    newQueryArray: SearchQueryPart[]
}

const testData: TestData[] = [
    {
        newFilterObj: {
            filterType: 'tag',
            filters: [],
            rawContent: '',
        },
        oldQueryArray: [],
        newQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: [],
                    rawContent: '',
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'domain',
            filters: ['domain'],
            rawContent: 'domain',
        },
        oldQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'domain',
                    filters: [],
                    rawContent: '',
                },
            },
        ],
        newQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'domain',
                    filters: ['domain'],
                    rawContent: 'domain',
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'date',
            variant: 'from',
            filters: ['date'],
            rawContent: '"date"',
        },
        oldQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'search' },
            },
        ],
        newQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'search ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'list',
            filters: ['other lists'],
            rawContent: '"other lists"',
        },
        oldQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list'],
                    rawContent: 'list',
                },
            },
        ],
        newQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list', 'other lists'],
                    rawContent: 'list,"other lists"',
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'date',
            variant: 'to',
            filters: ['date'],
            rawContent: '"date"',
        },
        oldQueryArray: [],
        newQueryArray: [
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'to',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'tag',
            filters: ['foo bar'],
            rawContent: '"foo bar"',
        },
        oldQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'bar' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['foo', 'bar'],
                    rawContent: 'foo,bar',
                },
            },
            {
                type: 'queryString',
                detail: { value: 'foo' },
            },
        ],
        newQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'bar' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['foo', 'bar', 'foo bar'],
                    rawContent: 'foo,bar,"foo bar"',
                },
            },
            {
                type: 'queryString',
                detail: { value: 'foo' },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'date',
            variant: 'to',
            filters: [''],
            rawContent: '',
        },
        oldQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
            {
                type: 'queryString',
                detail: { value: 'bar' },
            },
        ],
        newQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'to',
                    filters: [''],
                    rawContent: '',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' bar' },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'date',
            variant: 'to',
            filters: ['other date'],
            rawContent: '"other date"',
        },
        oldQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
            {
                type: 'queryString',
                detail: { value: 'bar' },
            },
        ],
        newQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'date',
                    variant: 'to',
                    filters: ['other date'],
                    rawContent: '"other date"',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' bar' },
            },
        ],
    },
    {
        newFilterObj: {
            filterType: 'list',
            filters: ['better list'],
            rawContent: '"better list"',
        },
        oldQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['tag', 'other tag'],
                    rawContent: 'tag,"other tag"',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list', 'other '],
                    rawContent: 'list,"other ',
                    lastFilterIncompleteQuote: true,
                },
            },
        ],
        newQueryArray: [
            {
                type: 'queryString',
                detail: { value: 'foo' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['tag', 'other tag'],
                    rawContent: 'tag,"other tag"',
                },
            },
            {
                type: 'queryString',
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list', 'other ', 'better list'],
                    rawContent: 'list,"other ","better list"',
                },
            },
        ],
    },
]

export default testData

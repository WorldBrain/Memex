import { SearchFilterDetail, ParsedSearchQuery } from './types'

const testStrings: string[] = [
    `t:`,
    `d:domain`,
    `search`,
    `search term`,
    `c:list`,
    `t:tag`,
    `from:"date"`,
    `to:"date"`,
    ``,
    `foo t:foo,"bar"foo`,
    `foo t:foo,bar,"foo"" bar"`,
    `t:foo foo bar foo bar`,
    `bar t:foo,bar,"foo bar" foo `,
    ` foo from:"date" to:"other date" bar`,
    `foo t:tag,"other tag"  c:list,"other list"`,
    `foo t:tag,"other tag" c:list,"other `,
    `foo t:tag bar d:foo.com,foobar.com foobar `,
]

interface TestData {
    queryString: string
    parsedQuery: ParsedSearchQuery
}

const testData: TestData[] = [
    {
        queryString: `t:`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: 1,
                detail: {
                    type: 'tag',
                    filters: [],
                    rawContent: '',
                },
            },
        ],
    },
    {
        queryString: `d:domain`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: 7,
                detail: {
                    type: 'domain',
                    filters: [],
                    query: 'domain',
                    rawContent: 'd:domain',
                },
            },
        ],
    },
    {
        queryString: `search`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: 5,
                detail: { value: 'search' },
            },
        ],
    },
    {
        queryString: `search term`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `search term`.length - 1,
                detail: { value: 'search term' },
            },
        ],
    },
    {
        queryString: `c:list`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: `c:list`.length - 1,
                detail: {
                    type: 'list',
                    filters: [],
                    query: 'list',
                    rawContent: 'c:list',
                },
            },
        ],
    },
    {
        queryString: `t:tag`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: `t:tag`.length - 1,
                detail: {
                    type: 'tag',
                    filters: [],
                    query: 'tag',
                    rawContent: 't:tag',
                },
            },
        ],
    },
    {
        queryString: `from:"date"`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: `from:"date"`.length - 1,
                detail: {
                    type: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: 'from:"date"',
                },
            },
        ],
    },
    {
        queryString: `to:"date"`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: `to:"date"`.length - 1,
                detail: {
                    type: 'date',
                    variant: 'to',
                    filters: ['date'],
                    rawContent: 'to:"date"',
                },
            },
        ],
    },
    {
        queryString: ``,
        parsedQuery: [],
    },
    {
        queryString: `foo t:foo,"bar"foo`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: 'foo '.length - 1,
                detail: {
                    value: 'foo ',
                },
            },
            {
                type: 'filter',
                startIndex: 'foo '.length,
                endIndex: 'foo t:foo,"bar"'.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['foo', 'bar'],
                    rawContent: 't:foo,"bar"',
                },
            },
            {
                type: 'searchString',
                startIndex: 'foo t:foo,"bar"'.length,
                endIndex: `foo t:foo,"bar"foo`.length - 1,
                detail: {
                    value: 'foo',
                },
            },
        ],
    },
    {
        queryString: `foo t:foo,bar,"foo"" bar"`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: 'foo '.length - 1,
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                startIndex: 'foo '.length,
                endIndex: `foo t:foo,bar,"foo"`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['foo', 'bar', 'foo'],
                    rawContent: 't:foo,bar,"foo"',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:foo,bar,"foo"`.length,
                endIndex: `foo t:foo,bar,"foo"" bar"`.length - 1,
                detail: {
                    value: '" bar"',
                },
            },
        ],
    },
    {
        queryString: `t:foo foo bar foo bar`,
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: `t:foo`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['foo'],
                    rawContent: 't:foo',
                },
            },
            {
                type: 'searchString',
                startIndex: `t:foo`.length,
                endIndex: `t:foo foo bar foo bar`.length - 1,
                detail: { value: ' foo bar foo bar' },
            },
        ],
    },
    {
        queryString: `bar t:foo,bar,"foo bar" foo `,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `bar `.length - 1,
                detail: { value: 'bar ' },
            },
            {
                type: 'filter',
                startIndex: `bar `.length,
                endIndex: `bar t:foo,bar,"foo bar"`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['foo', 'bar', 'foo bar'],
                    rawContent: 't:foo,bar,"foo bar"',
                },
            },
            {
                type: 'searchString',
                startIndex: `bar t:foo,bar,"foo bar"`.length,
                endIndex: `bar t:foo,bar,"foo bar" foo `.length - 1,
                detail: { value: ' foo ' },
            },
        ],
    },
    {
        queryString: ` foo from:"date" to:"other date" bar`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: ` foo `.length - 1,
                detail: { value: ' foo ' },
            },
            {
                type: 'filter',
                startIndex: ` foo `.length,
                endIndex: ` foo from:"date"`.length - 1,
                detail: {
                    type: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: 'from:"date"',
                },
            },
            {
                type: 'searchString',
                startIndex: ` foo from:"date"`.length,
                endIndex: ` foo from:"date" `.length - 1,
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                startIndex: ` foo from:"date" `.length,
                endIndex: ` foo from:"date" to:"other date"`.length - 1,
                detail: {
                    type: 'date',
                    variant: 'to',
                    filters: ['other date'],
                    rawContent: 'to:"other date"',
                },
            },
            {
                type: 'searchString',
                startIndex: ` foo from:"date" to:"other date"`.length,
                endIndex: ` foo from:"date" to:"other date" bar`.length - 1,
                detail: { value: ' bar' },
            },
        ],
    },
    {
        queryString: `foo t:tag,"other tag"  c:list,"other list"`,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `foo `.length - 1,
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                startIndex: `foo `.length,
                endIndex: `foo t:tag,"other tag"`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['tag', 'other tag'],
                    rawContent: 't:tag,"other tag"',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:tag,"other tag"`.length,
                endIndex: `foo t:tag,"other tag"  `.length - 1,
                detail: { value: '  ' },
            },
            {
                type: 'filter',
                startIndex: `foo t:tag,"other tag"  `.length,
                endIndex:
                    `foo t:tag,"other tag"  c:list,"other list"`.length - 1,
                detail: {
                    type: 'list',
                    filters: ['list', 'other list'],
                    rawContent: 'c:list,"other list"',
                },
            },
        ],
    },
    {
        queryString: `foo t:tag,"other tag" c:list,"other `,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `foo `.length - 1,
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                startIndex: `foo `.length,
                endIndex: `foo t:tag,"other tag"`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['tag', 'other tag'],
                    rawContent: 't:tag,"other tag"',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:tag,"other tag"`.length,
                endIndex: `foo t:tag,"other tag" `.length - 1,
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                startIndex: `foo t:tag,"other tag" `.length,
                endIndex: `foo t:tag,"other tag" d:domain,"other `.length - 1,
                detail: {
                    type: 'domain',
                    filters: ['domain'],
                    rawContent: 'd:domain,"other ',
                    query: `other `,
                },
            },
        ],
    },
    {
        queryString: `foo t:tag bar d:foo.com,foobar.com foobar `,
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `foo `.length - 1,
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                startIndex: `foo `.length,
                endIndex: `foo t:tag`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['tag'],
                    rawContent: 't:tag',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:tag`.length,
                endIndex: `foo t:tag bar `.length - 1,
                detail: { value: ' bar ' },
            },
            {
                type: 'filter',
                startIndex: `foo t:tag bar `.length,
                endIndex: `foo t:tag bar d:foo.com,foobar.com`.length - 1,
                detail: {
                    type: 'domain',
                    filters: ['foo.com', 'foobar.com'],
                    rawContent: 'd:foo.com,foobar.com',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:tag bar d:foo.com,foobar.com`.length,
                endIndex:
                    `foo t:tag bar d:foo.com,foobar.com foobar `.length - 1,
                detail: { value: ' foobar ' },
            },
        ],
    },
]

export default testData

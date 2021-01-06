import {
    FilterMutationDetail,
    ParsedSearchQuery,
    QueryFilterPart,
    SearchFilterDetail,
} from './types'

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

interface FiltersTestData {
    updatedFilters: SearchFilterDetail
    newQuery: string
    cursorIndex: number
}

interface TestData {
    queryString: string
    filtersData?: FiltersTestData
    parsedQuery?: ParsedSearchQuery
}

export const testData: TestData[] = [
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
                    rawContent: 't:',
                },
            },
        ],
    },
    {
        queryString: `d:domain`,
        filtersData: {
            updatedFilters: {
                type: 'domain',
                filters: [],
                query: 'domain',
                rawContent: `d:domain`,
            },
            newQuery: `d:domain `,
            cursorIndex: `d:domain `.length - 1,
        },
        parsedQuery: [
            {
                type: 'filter',
                startIndex: 0,
                endIndex: 'd:domain'.length - 1,
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
        queryString: `search term d:`,
        filtersData: {
            updatedFilters: {
                type: 'domain',
                filters: [],
                query: 'Doma',
                rawContent: `d:Doma`,
            },
            newQuery: 'search term d:Doma',
            cursorIndex: 'search term d:Doma'.length - 1,
        },
        parsedQuery: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `search term `.length - 1,
                detail: { value: 'search term ' },
            },
            {
                type: 'filter',
                startIndex: 'search term '.length,
                endIndex: 'search term d:'.length - 1,
                detail: {
                    type: 'domain',
                    filters: [],
                    rawContent: 'd:',
                },
            },
        ],
    },
    {
        queryString: `c:list`,
        filtersData: {
            updatedFilters: {
                type: 'list',
                filters: [],
                rawContent: 'c:',
            },
            newQuery: 'c:',
            cursorIndex: 'c:'.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'domain',
                filters: [],
                query: 'domain',
                rawContent: 'd:domain',
            },
            newQuery: `t:tag d:domain`,
            cursorIndex: `t:tag d:domain`.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'date',
                variant: 'from',
                filters: ['date'],
                rawContent: 'from:"date"',
            },
            newQuery: 'from:"date" ',
            cursorIndex: 'from:"date" '.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: ['tagzzz'],
                rawContent: 't:tagzzz',
            },
            newQuery: 'to:"date" t:tagzzz ',
            cursorIndex: 'to:"date" t:tagzzz '.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'date',
                variant: 'from',
                filters: ['dis a date'],
                rawContent: 'from:"dis a date"',
            },
            newQuery: 'from:"dis a date"',
            cursorIndex: 'from:"dis a date"'.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: ['foo'],
                rawContent: 't:foo',
            },
            newQuery: `foo t:foo foo`,
            cursorIndex: `foo t:foo`.length - 1,
        },
    },
    {
        queryString: `foo t:foo,bar,"foo bar"" bar"`,
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: ['foo', 'bar'],
                rawContent: 't:foo,bar',
            },
            newQuery: `foo t:foo,bar " bar"`,
            cursorIndex: `foo t:foo,bar`.length - 1,
        },
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
                endIndex: `foo t:foo,bar,"foo bar"`.length - 1,
                detail: {
                    type: 'tag',
                    filters: ['foo', 'bar', 'foo bar'],
                    rawContent: 't:foo,bar,"foo bar"',
                },
            },
            {
                type: 'searchString',
                startIndex: `foo t:foo,bar,"foo bar"`.length,
                endIndex: `foo t:foo,bar,"foo bar"" bar"`.length - 1,
                detail: {
                    value: '" bar"',
                },
            },
        ],
    },
    {
        queryString: `foo t:foo,bar,"foo bar"" bar"`,
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: ['foo', 'bar', 'foo bar', 'fooey'],
                rawContent: 't:foo,bar,"foo bar",fooey',
            },
            newQuery: `foo t:foo,bar,"foo bar",fooey " bar"`,
            cursorIndex: `foo t:foo,bar,"foo bar",fooey " bar"`.length - 1,
        },
    },
    {
        queryString: `t:foo foo bar foo bar`,
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: [],
                rawContent: 't:',
            },
            newQuery: 't: foo bar foo bar',
            cursorIndex: 't:'.length - 1,
        },
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
        filtersData: {
            updatedFilters: {
                type: 'tag',
                filters: ['tag', 'other tag'],
                query: 'yet another ta',
                rawContent: 't:tag,"other tag","yet another ta',
            },
            newQuery: `foo t:tag,"other tag","yet another ta c:list,"other list"`,
            cursorIndex: `foo t:tag,"other tag","yet another ta`.length - 1,
        },
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
        queryString: `foo t:tag,"other tag" d:domain,"other `,
        filtersData: {
            updatedFilters: {
                type: 'domain',
                filters: ['domain', 'other domain'],
                rawContent: 'd:domain,"other domain"',
            },
            newQuery: `foo t:tag,"other tag" d:domain,"other domain"`,
            cursorIndex:
                `foo t:tag,"other tag" d:domain,"other domain"`.length - 1,
        },
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

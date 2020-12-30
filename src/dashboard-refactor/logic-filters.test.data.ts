import { SearchFilterDetail, ParsedSearchQuery } from './types'

const testStrings = [
    't:',
    `d:domain`,
    `search`,
    `search term`,
    `c:list `,
    `t:tag`,
    `from:"date"`,
    `to:"date"`,
    ``,
    `bar t:foo,bar,"foo bar" foo`,
    `foo from:"date" to:"other date" bar`,
    `foo t:tag,"other tag" c:list,"other list"`,
    `foo t:tag,"other tag" c:list,"other `,
    `foo t:tag bar d:foo.com,foobar.com foobar`,
]

interface ParsingTestData {
    testString: string
    expected: ParsedSearchQuery
}

const parsingTestData: ParsingTestData[] = [
    {
        testString: `t:`,
        expected: [
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
        testString: `d:domain`,
        expected: [
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
        testString: `search`,
        expected: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: 5,
                detail: { value: 'search' },
            },
        ],
    },
    {
        testString: `search term`,
        expected: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: `search term`.length - 1,
                detail: { value: 'search term' },
            },
        ],
    },
    {
        testString: `c:list`,
        expected: [
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
        testString: `t:tag`,
        expected: [
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
        testString: `from:"date"`,
        expected: [
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
        testString: `to:"date"`,
        expected: [
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
        testString: ``,
        expected: [],
    },
    {
        testString: `foo t:foo,"bar"foo`,
        expected: [
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
        testString: `foo t:foo,bar,"foo"" bar"`,
        expected: [
            {
                type: 'searchString',
                startIndex: 0,
                endIndex: 'foo '.length - 1,
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['foo', 'bar', 'foo'],
                    rawContent: 'foo,bar,"foo"',
                },
            },
            {
                type: 'searchString',
                detail: {
                    value: '" bar"',
                },
            },
        ],
    },
    {
        testString: `t:foo foo bar foo bar`,
        expected: [
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['foo'],
                    rawContent: 'foo',
                },
            },
            {
                type: 'searchString',
                detail: { value: ' foo bar foo bar' },
            },
        ],
    },
    {
        testString: `bar t:foo,bar,"foo bar" foo`,
        expected: [
            {
                type: 'searchString',
                detail: { value: 'bar ' },
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
                type: 'searchString',
                detail: { value: ' foo' },
            },
        ],
    },
    {
        testString: `foo from:"date" to:"other date" bar`,
        expected: [
            {
                type: 'searchString',
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
                type: 'searchString',
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
                type: 'searchString',
                detail: { value: ' bar' },
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag"  c:list,"other list"`,
        expected: [
            {
                type: 'searchString',
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
                type: 'searchString',
                detail: { value: '  ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list', 'other list'],
                    rawContent: 'list,"other list"',
                },
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag" c:list,"other `,
        expected: [
            {
                type: 'searchString',
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
                type: 'searchString',
                detail: { value: ' ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'list',
                    filters: ['list', 'other '],
                    rawContent: 'list,"other ',
                },
            },
        ],
    },
    {
        testString: `foo t:tag bar d:foo.com,foobar.com foobar `,
        expected: [
            {
                type: 'searchString',
                detail: { value: 'foo ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['tag'],
                    rawContent: 'tag',
                },
            },
            {
                type: 'searchString',
                detail: { value: ' bar ' },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'domain',
                    filters: ['foo.com', 'foobar.com'],
                    rawContent: 'foo.com,foobar.com',
                },
            },
            {
                type: 'searchString',
                detail: { value: ' foobar ' },
            },
        ],
    },
]

export default testData

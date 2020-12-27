import { SearchQueryPart } from '../types'

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
//     `foo t:foo,bar,"foo"" bar"`,
//     `t:foo foo bar foo bar`,
//     `foo t:foo,bar,"foo bar" bar`,
//     `foo from:"date" to:"other date" bar`,
//     `foo t:tag,"other tag" c:list,"other list"`,
//     `foo t:tag,"other tag" c:list,"other `,
//     `foo t:tag bar d:foo.com,foobar.com foobar`,
// ]

interface TestData {
    testString: string
    expected: SearchQueryPart[]
}

const testData: TestData[] = [
    {
        testString: `t:`,
        expected: [
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
        testString: `d:domain`,
        expected: [
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
        testString: `search`,
        expected: [
            {
                type: 'searchTerm',
                detail: { value: 'search' },
            },
        ],
    },
    {
        testString: `search term`,
        expected: [
            {
                type: 'searchTerm',
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
                    filterType: 'list',
                    filters: ['list'],
                    rawContent: 'list',
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
                    filterType: 'tag',
                    filters: ['tag'],
                    rawContent: 'tag',
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
                    filterType: 'date',
                    variant: 'from',
                    filters: ['date'],
                    rawContent: '"date"',
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
                    filterType: 'date',
                    variant: 'to',
                    filters: ['date'],
                    rawContent: '"date"',
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
                type: 'searchTerm',
                detail: {
                    value: 'foo ',
                },
            },
            {
                type: 'filter',
                detail: {
                    filterType: 'tag',
                    filters: ['foo', 'bar'],
                    rawContent: 'foo,"bar"',
                },
            },
            {
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
                detail: { value: ' foo bar foo bar' },
            },
        ],
    },
    {
        testString: `bar t:foo,bar,"foo bar" foo`,
        expected: [
            {
                type: 'searchTerm',
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
                type: 'searchTerm',
                detail: { value: ' foo' },
            },
        ],
    },
    {
        testString: `foo from:"date" to:"other date" bar`,
        expected: [
            {
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
                detail: { value: ' bar' },
            },
        ],
    },
    {
        testString: `foo t:tag,"other tag"  c:list,"other list"`,
        expected: [
            {
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
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
                type: 'searchTerm',
                detail: { value: ' foobar ' },
            },
        ],
    },
]

export default testData

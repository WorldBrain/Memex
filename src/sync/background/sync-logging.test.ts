import { filterSyncLog } from './sync-logging'

describe('Sync logging preprocessor', () => {
    it('should filter out screenshots from createObject operations', async () => {
        expect(
            await filterSyncLog({
                operation: [
                    'createObject',
                    'pages',
                    { url: 'http://foo.com', screenshot: 'boohoo' },
                ],
            }),
        ).toEqual({
            operation: [
                'createObject',
                'pages',
                { url: 'http://foo.com', screenshot: 'boohoo' },
            ],
            loggedOperation: [
                'createObject',
                'pages',
                { url: 'http://foo.com' },
            ],
        })
    })

    it('should filter out terms fields from createObject operations', async () => {
        expect(
            await filterSyncLog({
                operation: [
                    'createObject',
                    'pages',
                    {
                        url: 'http://foo.com',
                        text: 'one two three',
                        terms: ['one', 'two', 'three'],
                    },
                ],
            }),
        ).toEqual({
            operation: [
                'createObject',
                'pages',
                {
                    url: 'http://foo.com',
                    text: 'one two three',
                    terms: ['one', 'two', 'three'],
                },
            ],
            loggedOperation: [
                'createObject',
                'pages',
                { url: 'http://foo.com', text: 'one two three' },
            ],
        })
    })

    for (const operationType of ['updateObject', 'updateObjects']) {
        it(`should filter out screenshots from ${operationType} operations containing other updates`, async () => {
            expect(
                await filterSyncLog({
                    operation: [
                        operationType,
                        'pages',
                        { url: 'http://foo.com' },
                        { fullTitle: 'blargh!', screenshot: 'boohoo' },
                    ],
                }),
            ).toEqual({
                operation: [
                    operationType,
                    'pages',
                    { url: 'http://foo.com' },
                    { fullTitle: 'blargh!', screenshot: 'boohoo' },
                ],
                loggedOperation: [
                    operationType,
                    'pages',
                    { url: 'http://foo.com' },
                    { fullTitle: 'blargh!' },
                ],
            })
        })

        it(`should filter out term fields from ${operationType} operations containing other updates`, async () => {
            expect(
                await filterSyncLog({
                    operation: [
                        operationType,
                        'pages',
                        { url: 'http://foo.com' },
                        {
                            fullTitle: 'one two three',
                            titleTerms: ['one', 'two', 'three'],
                        },
                    ],
                }),
            ).toEqual({
                operation: [
                    operationType,
                    'pages',
                    { url: 'http://foo.com' },
                    {
                        fullTitle: 'one two three',
                        titleTerms: ['one', 'two', 'three'],
                    },
                ],
                loggedOperation: [
                    operationType,
                    'pages',
                    { url: 'http://foo.com' },
                    { fullTitle: 'one two three' },
                ],
            })
        })

        it(`should filter out screenshots from ${operationType} operations containing no other updates`, async () => {
            expect(
                await filterSyncLog({
                    operation: [
                        operationType,
                        'pages',
                        { url: 'http://foo.com' },
                        { screenshot: 'boohoo' },
                    ],
                }),
            ).toEqual({ operation: null })
        })
    }
})

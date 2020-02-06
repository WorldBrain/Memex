import { filterBlobsFromSyncLog } from './sync-logging'

describe('Sync logging preprocessor', () => {
    it('should filter out screenshots from createObject operations', async () => {
        expect(
            await filterBlobsFromSyncLog({
                operation: [
                    'createObject',
                    'pages',
                    { url: 'http://foo.com', screenshot: 'boohoo' },
                ],
            }),
        ).toEqual({
            operation: ['createObject', 'pages', { url: 'http://foo.com' }],
        })
    })

    it('should filter out terms fields from createObject operations', async () => {
        expect(
            await filterBlobsFromSyncLog({
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
                { url: 'http://foo.com', text: 'one two three' },
            ],
        })
    })

    it('should filter out screenshots from updateObjects operations containing other updates', async () => {
        expect(
            await filterBlobsFromSyncLog({
                operation: [
                    'updateObjects',
                    'pages',
                    { url: 'http://foo.com' },
                    { fullTitle: 'blargh!', screenshot: 'boohoo' },
                ],
            }),
        ).toEqual({
            operation: [
                'updateObjects',
                'pages',
                { url: 'http://foo.com' },
                { fullTitle: 'blargh!' },
            ],
        })
    })

    it('should filter out term fields from updateObjects operations containing other updates', async () => {
        expect(
            await filterBlobsFromSyncLog({
                operation: [
                    'updateObjects',
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
                'updateObjects',
                'pages',
                { url: 'http://foo.com' },
                { fullTitle: 'one two three' },
            ],
        })
    })

    it('should filter out screenshots from updateObjects operations containing no other updates', async () => {
        expect(
            await filterBlobsFromSyncLog({
                operation: [
                    'updateObjects',
                    'pages',
                    { url: 'http://foo.com' },
                    { screenshot: 'boohoo' },
                ],
            }),
        ).toEqual({ operation: null })
    })
})

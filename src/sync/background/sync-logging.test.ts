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

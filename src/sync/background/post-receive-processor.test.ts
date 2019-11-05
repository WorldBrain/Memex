import expect from 'expect'

import { FetchPageDataError } from 'src/page-analysis/background/fetch-page-data-error'
import { PostReceiveProcessor } from './post-receive-processor'
import * as DATA from './post-receive-processor.test.data'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import { PageFetchBacklogBackground } from 'src/page-fetch-backlog/background'

function setupTest() {
    const mockStdPageFetcher = ({ url }) => ({
        run: async () => ({
            content: { title: 'test title', fullText: 'some test text' },
            url,
        }),
        cancel: () => undefined,
    })

    const mockPermFailurePageFetcher = ({ url }) => ({
        run: async () => {
            throw new FetchPageDataError('', 'permanent')
        },
        cancel: () => undefined,
    })

    const mockTempFailurePageFetcher = ({ url }) => ({
        run: async () => {
            throw new FetchPageDataError('', 'temporary')
        },
        cancel: () => undefined,
    })

    const mockPagePipeline = async ({ pageDoc }) => ({
        url: pageDoc.url,
        fullUrl: pageDoc.url,
        fullTitle: pageDoc.content.title,
        domain: pageDoc.url,
        hostname: pageDoc.url,
        tags: [],
        terms: [],
        urlTerms: [],
        titleTerms: [],
        text: pageDoc.content.fullText,
    })

    const mockBacklog = {
        tmp: null,
        enqueueEntry: ({ url }) => {
            mockBacklog.tmp = url
        },
    }

    return {
        stdProcessor: new PostReceiveProcessor({
            pageFetchBacklog: mockBacklog as any,
            fetchPageData: new FetchPageDataProcessor({
                fetchPageData: mockStdPageFetcher,
                pagePipeline: mockPagePipeline,
            }),
        }).processor,
        tempFailingProcessor: new PostReceiveProcessor({
            pageFetchBacklog: mockBacklog as any,
            fetchPageData: new FetchPageDataProcessor({
                fetchPageData: mockTempFailurePageFetcher,
                pagePipeline: mockPagePipeline,
            }),
        }).processor,
        permFailingProcessor: new PostReceiveProcessor({
            pageFetchBacklog: mockBacklog as any,
            fetchPageData: new FetchPageDataProcessor({
                fetchPageData: mockPermFailurePageFetcher,
                pagePipeline: mockPagePipeline,
            }),
        }).processor,
        mockBacklog,
    }
}

describe('sync post-receive processor', () => {
    it('should not process non-page-create sync entries', async () => {
        const { stdProcessor: processor } = setupTest()

        expect(await processor({ entry: DATA.bookmarkCreateA })).toEqual({
            entry: DATA.bookmarkCreateA,
        })
        expect(await processor({ entry: DATA.pageModifyA })).toEqual({
            entry: DATA.pageModifyA,
        })
        expect(await processor({ entry: DATA.pageCreateA })).not.toEqual({
            entry: DATA.pageCreateA,
        })
    })

    it('should process a page-create sync entry, filling in missing data', async () => {
        const { stdProcessor: processor } = setupTest()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: {
                ...DATA.pageCreateA,
                data: {
                    ...DATA.pageCreateA.data,
                    value: {
                        url: DATA.pageCreateA.data.pk,
                        fullUrl: DATA.pageCreateA.data.pk,
                        fullTitle: 'test title',
                        domain: DATA.pageCreateA.data.pk,
                        hostname: DATA.pageCreateA.data.pk,
                        tags: [],
                        terms: [],
                        urlTerms: [],
                        titleTerms: [],
                        text: 'some test text',
                    },
                },
            },
        })
    })

    it('should process a stub entry with URL as title on permanent failures', async () => {
        const { permFailingProcessor: processor } = setupTest()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: {
                ...DATA.pageCreateA,
                data: {
                    ...DATA.pageCreateA.data,
                    value: {
                        url: DATA.pageCreateA.data.pk,
                        fullUrl: DATA.pageCreateA.data.pk,
                        fullTitle: DATA.pageCreateA.data.pk,
                        domain: DATA.pageCreateA.data.pk,
                        hostname: DATA.pageCreateA.data.pk,
                        tags: [],
                        terms: [],
                        urlTerms: [],
                        titleTerms: [],
                        text: undefined,
                    },
                },
            },
        })
    })

    it('should process a null entry on temporary failures', async () => {
        const { tempFailingProcessor: processor } = setupTest()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: null,
        })
    })

    it('should enqueue entry on page backlog in the case of a failure', async () => {
        const { tempFailingProcessor: processor, mockBacklog } = setupTest()

        expect(mockBacklog.tmp).not.toBe(DATA.pageCreateA.data.pk)
        expect(mockBacklog.tmp).toBeNull()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: null,
        })

        expect(mockBacklog.tmp).toBe(DATA.pageCreateA.data.pk)
    })
})

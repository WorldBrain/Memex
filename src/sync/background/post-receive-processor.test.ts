import expect from 'expect'

import {
    FetchPageDataError,
    FetchPageDataErrorType,
} from 'src/page-analysis/background/fetch-page-data-error'
import { PostReceiveProcessor } from './post-receive-processor'
import * as DATA from './post-receive-processor.test.data'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'

const createMockStdPageFetcher = ({
    errorType,
    favIconURI,
}: {
    errorType?: FetchPageDataErrorType
    favIconURI?: string
}) => ({ url }) => ({
    cancel: () => undefined,
    run: async () => {
        if (errorType) {
            throw new FetchPageDataError('', errorType)
        }

        return {
            content: {
                title: 'test title',
                fullText: 'some test text',
                favIconURI,
            },
            url,
        }
    },
})

function setupTest({
    pageFetcher = createMockStdPageFetcher({}),
    favIconAdder = () => undefined,
}: {
    pageFetcher?: any
    favIconAdder?: any
}) {
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
        favIconURI: pageDoc.content.favIconURI,
    })

    const mockBacklog = {
        tmp: null,
        enqueueEntry: ({ url }) => {
            mockBacklog.tmp = url
        },
    }

    return {
        processor: new PostReceiveProcessor({
            pages: { addFavIconIfNeeded: favIconAdder } as any,
            pageFetchBacklog: mockBacklog as any,
            fetchPageData: new FetchPageDataProcessor({
                pagePipeline: mockPagePipeline,
                fetchPageData: pageFetcher,
            }),
        }).processor,
        mockBacklog,
    }
}

describe('sync post-receive processor', () => {
    it('should not process non-page-create sync entries', async () => {
        const { processor } = setupTest({})

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

    it('should not process incoming page-create sync entries with data attached', async () => {
        const { processor } = setupTest({})

        expect(await processor({ entry: DATA.pageCreateB })).toEqual({
            entry: DATA.pageCreateB,
        })
    })

    it('should process a page-create sync entry, filling in missing data', async () => {
        const { processor } = setupTest({})

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: {
                ...DATA.pageCreateA,
                data: {
                    ...DATA.pageCreateA.data,
                    value: {
                        url: DATA.pageCreateA.data.value.fullUrl,
                        fullUrl: DATA.pageCreateA.data.value.fullUrl,
                        fullTitle: 'test title',
                        domain: DATA.pageCreateA.data.value.fullUrl,
                        hostname: DATA.pageCreateA.data.value.fullUrl,
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

    it('should process a page-create sync entry, filling in missing data + create a favIcon', async () => {
        const testFav = 'test'
        let favIconAdderArgs: [string, string]

        const { processor } = setupTest({
            pageFetcher: createMockStdPageFetcher({ favIconURI: testFav }),
            favIconAdder: (a, b) => (favIconAdderArgs = [a, b]),
        })

        expect(favIconAdderArgs).toBeUndefined()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: {
                ...DATA.pageCreateA,
                data: {
                    ...DATA.pageCreateA.data,
                    value: {
                        url: DATA.pageCreateA.data.value.fullUrl,
                        fullUrl: DATA.pageCreateA.data.value.fullUrl,
                        fullTitle: 'test title',
                        domain: DATA.pageCreateA.data.value.fullUrl,
                        hostname: DATA.pageCreateA.data.value.fullUrl,
                        tags: [],
                        terms: [],
                        urlTerms: [],
                        titleTerms: [],
                        text: 'some test text',
                    },
                },
            },
        })

        expect(favIconAdderArgs).toEqual([
            DATA.pageCreateA.data.value.fullUrl,
            testFav,
        ])
    })

    it('should process a stub entry with URL as title on permanent failures', async () => {
        const { processor } = setupTest({
            pageFetcher: createMockStdPageFetcher({ errorType: 'permanent' }),
        })

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: {
                ...DATA.pageCreateA,
                data: {
                    ...DATA.pageCreateA.data,
                    value: {
                        url: DATA.pageCreateA.data.value.fullUrl,
                        fullUrl: DATA.pageCreateA.data.value.fullUrl,
                        fullTitle: DATA.pageCreateA.data.value.fullUrl,
                        domain: DATA.pageCreateA.data.value.fullUrl,
                        hostname: DATA.pageCreateA.data.value.fullUrl,
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
        const { processor } = setupTest({
            pageFetcher: createMockStdPageFetcher({ errorType: 'temporary' }),
        })

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: null,
        })
    })

    it('should enqueue entry on page backlog in the case of a failure', async () => {
        const { processor, mockBacklog } = setupTest({
            pageFetcher: createMockStdPageFetcher({ errorType: 'temporary' }),
        })

        expect(mockBacklog.tmp).not.toBe(DATA.pageCreateA.data.pk)
        expect(mockBacklog.tmp).toBeNull()

        expect(await processor({ entry: DATA.pageCreateA })).toEqual({
            entry: null,
        })

        expect(mockBacklog.tmp).toBe(DATA.pageCreateA.data.pk)
    })
})

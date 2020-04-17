import expect from 'expect'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import * as DATA from './index.test.data'
import { PageFetchBacklogBackground } from '.'
import { PageFetchBacklogStorage } from './storage'
import initStorageManager from 'src/search/memory-storex'
import { FetchPageDataError } from 'src/page-analysis/background/fetch-page-data-error'
import { FetchPageDataProcessor } from 'src/page-analysis/background/fetch-page-data-processor'
import delay from 'src/util/delay'

const DEF_PROC_INTERVAL = 100
const DEF_RETRY_LIMIT = 4

const mockTempFailurePageFetcher = ({ url }) => ({
    run: async () => {
        throw new FetchPageDataError('', 'temporary')
    },
    cancel: () => undefined,
})

const mockStdPageFetcher = ({ url }) => ({
    run: async () => ({
        content: { url: 'test.com', fullText: 'some page content!' },
    }),
    cancel: () => undefined,
})

async function setupTest({
    retryLimit = DEF_RETRY_LIMIT,
    processingInterval = DEF_PROC_INTERVAL,
    pageFetcher = mockStdPageFetcher,
}) {
    async function mockPageStorer(content) {
        mockPageStorer.content = content
    }
    mockPageStorer.content = null

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

    const mockConnectivityChecker = {
        checkUntilConnected: () => Promise.resolve(),
        checkConnection: () => Promise.resolve(),
        isConnected: true,
    }

    const storageManager = initStorageManager()
    const backlog = new PageFetchBacklogBackground({
        storageManager,
        fetchPageData: new FetchPageDataProcessor({
            fetchPageData: pageFetcher as any,
            pagePipeline: mockPagePipeline,
        }),
        processingInterval,
        retryLimit,
        storePageContent: mockPageStorer,
        connectivityChecker: mockConnectivityChecker as any,
        retryIntervals: [0, 0, 0, 0, 0],
    })

    registerModuleMapCollections(storageManager.registry, {
        [PageFetchBacklogStorage.BACKLOG_COLL]: backlog['storage'],
    })
    await storageManager.finishInitialization()

    return { backlog, storageManager, mockPageStorer }
}

describe('failed page fetch backlog', () => {
    it('should be able to store entries', async () => {
        const { backlog, storageManager } = await setupTest({})

        for (const {
            data: { pk: url },
        } of [DATA.bookmarkCreateA, DATA.pageCreateA, DATA.pageModifyA]) {
            await backlog.enqueueEntry({ url })
        }

        expect(
            await storageManager
                .collection(PageFetchBacklogStorage.BACKLOG_COLL)
                .findObjects({}),
        ).toEqual([
            {
                id: expect.anything(),
                createdAt: expect.any(Date),
                lastRetry: expect.any(Date),
                url: DATA.bookmarkCreateA.data.pk,
                timesRetried: 0,
            },
            {
                id: expect.anything(),
                createdAt: expect.any(Date),
                lastRetry: expect.any(Date),
                url: DATA.pageCreateA.data.pk,
                timesRetried: 0,
            },
            {
                id: expect.anything(),
                createdAt: expect.any(Date),
                lastRetry: expect.any(Date),
                url: DATA.pageModifyA.data.pk,
                timesRetried: 0,
            },
        ])
    })

    it('should be able to fetch entries in order of oldest first', async () => {
        const { backlog } = await setupTest({})

        const data = [DATA.bookmarkCreateA, DATA.pageCreateA, DATA.pageModifyA]

        // Simple: enqueue all first, then dequeue them all
        for (const {
            data: { pk: url },
        } of data) {
            await backlog.enqueueEntry({ url })
        }

        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.bookmarkCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.pageCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.pageModifyA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual(null)

        // Mixed: enqueue all first, dequeue some, enqueue some more
        for (const {
            data: { pk: url },
        } of data) {
            await backlog.enqueueEntry({ url })
        }

        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.bookmarkCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.pageCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        await backlog.enqueueEntry({ url: DATA.pageCreateA.data.pk })
        await backlog.enqueueEntry({ url: DATA.bookmarkCreateA.data.pk })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.pageModifyA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.pageCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual({
            url: DATA.bookmarkCreateA.data.pk,
            lastRetry: expect.any(Date),
            timesRetried: 0,
        })
        expect(await backlog.dequeueEntry()).toEqual(null)

        // Cycle: enqueue all first, then dequeue and enqueue each entry until limit reached
        for (const {
            data: { pk: url },
        } of data) {
            await backlog.enqueueEntry({ url })
        }

        for (let i = 0; i < 20; i++) {
            const entry = await backlog.dequeueEntry()
            expect(entry).toEqual({
                url: data[i % data.length].data.pk,
                lastRetry: expect.any(Date),
                timesRetried: 0,
            })
            await backlog.enqueueEntry(entry)
        }
    })

    it('should retry failed processing on specified intervals', async () => {
        const { backlog, storageManager } = await setupTest({
            pageFetcher: mockTempFailurePageFetcher,
        })

        await backlog.enqueueEntry({
            url: DATA.pageCreateA.data.pk,
            lastRetry: new Date('2010-01-01'),
        })
        backlog.setupBacklogProcessing()
        // backlog['recurringTask'].stop()

        const expectedEntry = {
            id: expect.anything(),
            createdAt: expect.any(Date),
            lastRetry: expect.any(Date),
            url: DATA.pageCreateA.data.pk,
        }
        // await backlog['recurringTask'].forceRun()

        expect(
            await storageManager
                .collection(PageFetchBacklogStorage.BACKLOG_COLL)
                .findObjects({}),
        ).toEqual([
            {
                ...expectedEntry,
                timesRetried: 0,
            },
        ])
        // await backlog['recurringTask'].forceRun()

        // Wait at least the processing interval, after which the recurring task should trigger, then fail
        //  and reschedule the entry on the backlog (with retry count increased)
        await delay(DEF_PROC_INTERVAL * 2)

        expect(
            await storageManager
                .collection(PageFetchBacklogStorage.BACKLOG_COLL)
                .findObjects({}),
        ).toEqual([
            {
                ...expectedEntry,
                timesRetried: 1,
            },
        ])
    })

    it('should only retry failed processing up until retry limit reached', async () => {
        async function runRetryLimitTest({ retryLimit }) {
            const { backlog, storageManager } = await setupTest({
                retryLimit,
                pageFetcher: mockTempFailurePageFetcher,
            })

            await backlog.enqueueEntry({
                url: DATA.pageCreateA.data.pk,
            })
            backlog.setupBacklogProcessing()
            backlog['recurringTask'].stop()

            const expectedEntry = {
                id: expect.anything(),
                createdAt: expect.any(Date),
                url: DATA.pageCreateA.data.pk,
                lastRetry: expect.any(Date),
            }

            for (let retries = 0; retries <= retryLimit; retries++) {
                expect(
                    await storageManager
                        .collection(PageFetchBacklogStorage.BACKLOG_COLL)
                        .findObjects({}),
                ).toEqual([
                    {
                        ...expectedEntry,
                        timesRetried: retries,
                    },
                ])

                await backlog['recurringTask'].forceRun()
            }

            expect(
                await storageManager
                    .collection(PageFetchBacklogStorage.BACKLOG_COLL)
                    .findObjects({}),
            ).toEqual([])
        }

        await runRetryLimitTest({ retryLimit: 1 })
        await runRetryLimitTest({ retryLimit: 5 })
        await runRetryLimitTest({ retryLimit: 10 })
        await runRetryLimitTest({ retryLimit: 100 })
    })

    it('should store processing result on successful processing', async () => {
        const { backlog, mockPageStorer } = await setupTest({})

        expect(mockPageStorer.content).toBeNull()

        await backlog.enqueueEntry({
            url: DATA.pageCreateA.data.pk,
        })
        backlog.setupBacklogProcessing()
        await backlog['recurringTask'].forceRun()
        expect(mockPageStorer.content).not.toBeNull()
    })
})

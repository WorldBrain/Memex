/* eslint-env jest */

import { ImportStateManager as State } from './state-manager'
import DataSources from './data-sources'
import ItemCreator from './item-creator'
import { ImportItem } from './types'

import * as urlLists from './url-list.test.data'
import initData, { TestData, diff } from './state-manager.test.data'

type ForEachChunkCb = (
    values: [string, ImportItem][],
    chunkKey: string,
) => Promise<void>

jest.mock('src/blacklist/background/interface')
jest.mock('src/util/encode-url-for-id')
jest.mock('src/activity-logger')
jest.mock('src/search')
jest.mock('./cache')
jest.mock('./data-sources')

const runSuite = (DATA: TestData) => async () => {
    let state

    beforeAll(() => {
        // Init fake data source
        const dataSources = new DataSources({
            history: DATA.history,
            bookmarks: DATA.bookmarks,
        })

        const itemCreator = new ItemCreator({ dataSources })
        state = new State({ itemCreator })
    })

    // Clear and force re-calc for each test
    beforeEach(async () => {
        await state.clearItems()
        await state.fetchEsts()
    })

    test('duped input items do not influence state', async () => {
        // Init fake data source with duped history
        const dataSources = new DataSources({
            history: [...DATA.history, ...DATA.history],
            bookmarks: [],
        })

        const itemCreator = new ItemCreator({ dataSources })
        const localState = new State({ itemCreator }) as any
        await localState.fetchEsts()

        expect(localState.counts.completed).toEqual({ h: 0, b: 0 })
        expect(localState.counts.remaining).toEqual({
            // The actual counts should only be length of 1x test history (input is 2x)
            h: DATA.history.length,
            b: 0,
        })

        // Expect to iterate through the 1x # of item items
        let itemCount = 0
        for await (const { chunk } of localState.fetchItems()) {
            const values = Object.entries(chunk)
            itemCount += values.length
        }
        expect(itemCount).toBe(DATA.history.length)
    })

    test('state can get initd from cache', async () => {
        // Force update mock Cache with fake counts
        state._cache.counts = { ...DATA.fakeCacheCounts }

        // Force initing state from cache
        await state._initFromCache()

        // State counts should now equal to the mock Cache's new data
        expect(state.counts).toEqual(DATA.fakeCacheCounts)
    })

    // Will set up import items state and ensure counts are valid
    const testEstimateCounts = async () => {
        // Try to fetch ests (should invoke the ItemCreator -> DataSources to estimate counts, if cache expired)
        const counts = await state.fetchEsts()

        // Check the returned counts
        expect(counts.completed).toEqual({ h: 0, b: 0 })
        expect(counts.remaining).toEqual({
            h: diff(DATA.histUrls, DATA.bmUrls).length,
            b: DATA.bmUrls.length,
        })

        // Check that those same counts are cached on the State instance's mock Cache, and also the State instance
        expect(state._cache.counts).toEqual(counts)
        expect(state.counts).toEqual(counts)
    }

    test('counts can be calculated (cache miss)', async () => {
        // Ensure cache is dirtied
        state.dirtyEsts()
        expect(state._cache.expired).toBe(true)

        await testEstimateCounts()
    })

    test('counts can be calculated (cache hit)', async () => {
        // The cache should already be filled from `fetchEsts` running before test
        expect(state._cache.expired).toBe(false)

        // Run same estimate counts test again with filled cache
        await testEstimateCounts()
    })

    test('counts calcs should be consistent', async () => {
        state.dirtyEsts()
        let lastCounts = await state.fetchEsts()

        for (let i = 0; i < 5; i++) {
            state.dirtyEsts()
            const counts = await state.fetchEsts()

            // Current counts and last should be same
            expect(lastCounts).toEqual(counts)

            lastCounts = counts
        }
    })

    test('import items can be iterated through', async () => {
        const bookmarkItemUrls = []
        const historyItemUrls = []

        // For each item in each chunk, save the URL as bookmark/history and
        for await (const { chunk } of state.fetchItems()) {
            Object.values<ImportItem>(chunk).forEach(item => {
                if (item.type === 'h') {
                    historyItemUrls.push(item.url)
                } else {
                    bookmarkItemUrls.push(item.url)
                }
            })
        }

        expect(bookmarkItemUrls).toEqual(DATA.bmUrls)

        // Ensure we don't check the intersecting bm URLs in expected history URLs
        expect(historyItemUrls).toEqual(diff(DATA.histUrls, DATA.bmUrls))
    })

    const checkOff = (count, type, inc = 1) => ({
        ...count,
        [type]: count[type] + inc,
    })

    // Convenience function to async iterate import item chunks accessible via state instance
    async function forEachChunk(asyncCb: ForEachChunkCb, includeErrs = false) {
        for await (const { chunk, chunkKey } of state.fetchItems(includeErrs)) {
            const values = Object.entries<ImportItem>(chunk)

            // Skip empty chunks
            if (!values.length) {
                continue
            }

            await asyncCb(values, chunkKey)
        }
    }

    test('import items can be removed/marked-off', async () => {
        // These will change as items get marked off
        let expectedCompleted = { h: 0, b: 0 }
        let expectedRemaining = {
            h: diff(DATA.histUrls, DATA.bmUrls).length,
            b: DATA.bmUrls.length,
        }

        // For the first item of chunk, remove it, recalc expected counts, then check
        await forEachChunk(async ([[itemKey, { type }]], chunkKey) => {
            await state.removeItem(chunkKey, itemKey)

            // Update our expected values (one got checked off, so +1 completed, -1 remaining)
            expectedCompleted = checkOff(expectedCompleted, type, 1)
            expectedRemaining = checkOff(expectedRemaining, type, -1)

            expect(state.counts.completed).toEqual(expectedCompleted)
            expect(state.counts.remaining).toEqual(expectedRemaining)
        })
    })

    test('import items can be flagged as errors', async () => {
        const flaggedUrls = []
        // Remaining will change as items get marked as errors; completed won't
        const expectedCompleted = { h: 0, b: 0 }
        let expectedRemaining = {
            h: diff(DATA.histUrls, DATA.bmUrls).length,
            b: DATA.bmUrls.length,
        }

        // For the first item of chunk, flag it, recalc expected counts, then check
        await forEachChunk(async ([[itemKey, { type, url }]], chunkKey) => {
            await state.flagItemAsError(chunkKey, itemKey)
            flaggedUrls.push(url) // Keep track of the URLs we are flagging

            // Update our expected values (one got checked off, so +1 completed, -1 remaining)
            expectedRemaining = checkOff(expectedRemaining, type, -1)

            expect(state.counts.completed).toEqual(expectedCompleted)
            expect(state.counts.remaining).toEqual(expectedRemaining)
        })

        // Do another read, storing all error'd + okay item URLs
        const errordUrls = []
        const okayUrls = []
        await forEachChunk(async (values, chunkKey) => {
            const trackingArr = chunkKey.startsWith('err')
                ? errordUrls
                : okayUrls
            trackingArr.push(...values.map(([, item]) => item.url))
        }, true)

        // Error'd URLs from the read should be the same as the ones we have been keeping track of
        //  as we've been flagging
        expect(errordUrls).toEqual(flaggedUrls)

        // There should be no intersection between okay and errord URLs
        const errordSet = new Set(errordUrls)
        let intersected = false
        okayUrls.forEach(url => {
            if (errordSet.has(url)) {
                intersected = true
            }
        })
        expect(intersected).toBe(false)
    })
}

// Run import tests against different sized history/bookmark data sets
describe('Import items derivation', () => {
    describe(
        'hist: 1000+, bm: 1000+',
        runSuite(initData(urlLists.large, urlLists.large)),
    )
    describe(
        'hist: 1000+, bm: 30',
        runSuite(initData(urlLists.large, urlLists.large.slice(0, 30))),
    )
    describe(
        'hist: 200+, bm: 30',
        runSuite(initData(urlLists.med, urlLists.med.slice(0, 30))),
    )
    describe(
        'hist: 1000+, bm: 200+ - no bm intersection',
        runSuite(initData(urlLists.large, urlLists.med)),
    )
    describe(
        'hist: 200+, bm: 1000+ - no bm intersection',
        runSuite(initData(urlLists.med, urlLists.large)),
    )
    describe('hist: 1000+, bm: 0', runSuite(initData(urlLists.large, [])))
    describe('hist: 0, bm: 200+', runSuite(initData([], urlLists.med)))
    describe('hist: 0, bm: 0', runSuite(initData([], [])))
})

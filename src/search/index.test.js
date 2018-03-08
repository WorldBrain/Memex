/* eslint-env jest */

import memdown from 'memdown'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'

import normalizeUrl from 'src/util/encode-url-for-id'
import * as index from './'
import * as oldIndex from './search-index-old'
import * as newIndex from './search-index-new'
import { generatePageDocId } from 'src/page-storage'

oldIndex.init({ levelDown: memdown() })
newIndex.init({ indexedDB, IDBKeyRange })

// Test data (TODO: better way to manage this?)
const visit1 = Date.now()
const visit2 = visit1 - 1000 * 60
const visit3 = visit2 - 1000 * 60
const bookmark1 = visit1 - 1000 * 60 * 86400 // Bookmark from a day ago
const page1 = {
    url: 'https://www.test.com/test',
    content: {
        fullText: 'the wild fox jumped over the hairy red hen',
        title: 'test page',
    },
}
const page2 = {
    url: 'https://www.lorem.com/test1',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'test page 2',
    },
}
const page3 = {
    url: 'https://www.lorem.com/test2',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        title: 'test page 3',
    },
}

// Runs the same tests for either the new or old index
// TODO: clean this up....
const runSuite = useOld => () => {
    // Old model uses page IDs (derived from URL), new model simply uses URL
    const createId = url =>
        useOld ? generatePageDocId({ url }) : normalizeUrl(url)

    const expected1 = createId(page1.url)
    const expected2 = createId(page2.url)
    const expected3 = createId(page3.url)

    // Bind common search params
    const search = params => {
        // Map the old result objects to KVP array style of new results
        const mapResultsFunc = useOld
            ? async results => results.map(res => [res.id, res.score])
            : async results => results

        return index.search({ mapResultsFunc, ...params })
    }

    beforeAll(async () => {
        index.getBackend._reset({ useOld })

        // Insert some test data for all tests to use
        await index.addPage({ pageDoc: page1, visits: [visit1] })
        await index.addPage({
            pageDoc: page2,
            visits: [visit2],
            bookmark: bookmark1,
        })
        await index.addPage({ pageDoc: page3, visits: [visit3] })

        // Add some test tags
        await index.addTag(page1.url, 'good')
        await index.addTag(page1.url, 'quality')
        await index.addTag(page2.url, 'quality')
    })

    test('fetch page by URL', async () => {
        const runChecks = async page => {
            await page.loadRels()

            expect(page).toBeDefined()
            expect(page).not.toBeNull()
            expect(page.hasBookmark).toBe(false)
            expect(page.tags).toEqual(['good', 'quality'])

            expect(page.latest).toEqual(visit1)
        }

        runChecks(await index.getPage(page1.url))
        runChecks(await index.getPage('test.com/test')) // Should get normalized the same

        const page = await index.getPage(page2.url)
        await page.loadRels()

        expect(page).toBeDefined()
        expect(page).not.toBeNull()
        expect(page.hasBookmark).toBe(true)
        expect(page.latest).toEqual(visit2)
    })

    test('single term search', async () => {
        const { docs } = await search({ query: 'fox' })

        expect(docs.length).toBe(1)
        const [id, score] = docs[0]
        expect(id).toEqual(expected1)
        expect(score).toEqual(visit1)
    })

    test('multi-term search', async () => {
        const { docs } = await search({
            query: 'fox wild',
        })

        expect(docs.length).toBe(1)
        const [id, score] = docs[0]
        expect(id).toEqual(expected1)
        expect(score).toEqual(visit1)
    })

    test('time-filtered blank search', async () => {
        // Upper-bound
        const { docs: docsA } = await search({ endDate: bookmark1 })

        // All other data should be more recent
        expect(docsA.length).toBe(1)
        expect(docsA[0][0]).toEqual(expected2)
        expect(docsA[0][1]).toEqual(bookmark1)

        // Lower-bound
        const { docs: docsB } = await search({ startDate: visit1 })

        // All other data should be older
        expect(docsB.length).toBe(1)
        expect(docsB[0][0]).toEqual(expected1)
        expect(docsB[0][1]).toEqual(visit1)

        // Both bounds
        const { docs: docsC } = await search({
            startDate: visit3,
            endDate: visit2,
        })

        // Should be in order of visit
        expect(docsC.length).toBe(2)
        expect(docsC[0][0]).toEqual(expected2)
        expect(docsC[1][0]).toEqual(expected3)
    })

    test('paginated search', async () => {
        // Blank search but skipping the first 2 most-recent and only returning the 3rd
        const { docs: docsA } = await search({ skip: 2, limit: 2 })

        expect(docsA.length).toBe(1)
        expect(docsA[0][0]).toEqual(expected3)
        expect(docsA[0][1]).toEqual(visit3)

        // Skip passed the end
        const { docs: docsB } = await search({ skip: 10 })
        expect(docsB.length).toBe(0)
    })

    test('domains search', async () => {
        const { docs: loremDocs } = await search({ domains: ['lorem.com'] })

        expect(loremDocs.length).toBe(2)
        expect(loremDocs[0][0]).toEqual(expected2)
        expect(loremDocs[1][0]).toEqual(expected3)

        // Multi-domain
        const { docs: testDocs } = await search({
            domains: ['lorem.com', 'test.com'],
        })
        expect(testDocs.length).toBe(3)
        expect(testDocs[0][0]).toEqual(expected1)
        expect(testDocs[1][0]).toEqual(expected2)
        expect(testDocs[2][0]).toEqual(expected3)
    })

    async function testBlankSearch() {
        const { docs } = await search()

        // All docs, latest first
        expect(docs.length).toBe(3)
        expect(docs[0][0]).toEqual(expected1)
        expect(docs[1][0]).toEqual(expected2)
        expect(docs[2][0]).toEqual(expected3)
    }

    async function testTagsSearch() {
        const runChecks = docs => {
            expect(docs.length).toBe(2)
            expect(docs[0][0]).toEqual(expected1)
            expect(docs[1][0]).toEqual(expected2)
        }

        // Single tag
        const { docs: qualityDocs } = await search({ tags: ['quality'] })
        runChecks(qualityDocs)

        // Multi tag
        const { docs: multiDocs } = await search({
            tags: ['quality', 'good'],
        })
        runChecks(multiDocs) // Same checks should pass as both contain these tags
    }

    async function testBookmarkSearch() {
        const { docs } = await search({ showOnlyBookmarks: true })

        // We only have a single bookmark
        expect(docs.length).toBe(1)
        expect(docs[0][0]).toEqual(expected2)
        expect(docs[0][1]).toEqual(bookmark1)
    }

    test('blank search', testBlankSearch)
    test('tags search', testTagsSearch)
    test('bookmarks search', testBookmarkSearch)

    // Meant to be run in seq -> verify search, change data, search again
    // Not sure if this is the best way to do?
    describe('mutation tests', () => {
        const tmpBm = Date.now()
        const tmpVisit = Date.now()
        const tmpPage = {
            ...page1,
            url: 'https://www.test.com/delete-me',
        }

        const tmpExpected = createId(tmpPage.url)

        test('page adding affects search', async () => {
            // Insert a tmp page
            await index.addPage({
                pageDoc: tmpPage,
                visits: [tmpVisit],
            })

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // First result should be the new page
            expect(docs[0][0]).toEqual(tmpExpected)
            expect(docs.length).toBe(4)
            expect(docs[0][1]).toEqual(tmpVisit)

            // Expects from prev test should no longer pass
            expect(docs.length).not.toBe(3)
            expect(docs[0][0]).not.toEqual(expected1)
            expect(docs[1][0]).not.toEqual(expected2)
            expect(docs[2][0]).not.toEqual(expected3)
        })

        test('visit adding affects search', async () => {
            const visit = Date.now()
            await index.addVisit(tmpPage.url, visit)

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // These should be the same
            expect(docs[0][0]).toEqual(tmpExpected)
            expect(docs.length).toBe(4)

            // However the score should have changed
            expect(docs[0][1]).not.toEqual(tmpVisit)
            expect(docs[0][1]).toEqual(visit)
        })

        test('page deletion affects search', async () => {
            // Delete tmp page added from prev test then make sure same blank search test passes again
            await index.delPages([tmpPage.url])
            await testBlankSearch()
        })

        test('tag adding affects search', async () => {
            // This page doesn't have any tags; 'quality' tag has 2 other pages
            await index.addTag(page3.url, 'quality')

            const { docs } = await search({ tags: ['quality'] })
            expect(docs.length).not.toBe(2) // Base test data expectation
            expect(docs.length).toBe(3)
            expect(docs[2][0]).toEqual(expected3)
        })

        test('tag deleting affects search', async () => {
            await index.delTag(page3.url, 'quality')
            await testTagsSearch() // Should once again pass as we are now at original data state
        })

        test('bookmark adding affects search', async () => {
            // Add bm to 3rd test page
            await index.addBookmark({ url: page3.url, timestamp: tmpBm })

            const { docs } = await search({ showOnlyBookmarks: true })

            expect(docs.length).not.toBe(1) // Base test data expectation
            expect(docs.length).toBe(2)

            // Latest result should be from the recent bookmark event
            expect(docs[0][0]).toEqual(expected3)
            expect(docs[0][1]).toEqual(tmpBm)

            // Second-latest result should be our orig test bookmark data
            expect(docs[1][0]).toEqual(expected2)
            expect(docs[1][1]).toEqual(bookmark1)
        })

        test('bookmark deleting affects search', async () => {
            // Add bm to 3rd test page
            await index.delBookmark({ url: page3.url })
            await testBookmarkSearch() // Base data bookmark test should now pass again
        })

        test('page terms adding affects search', async () => {
            const query = 'rerun tests changed files'
            const { docs: before } = await search({ query })
            expect(before.length).toBe(0)

            await index.addPageTerms({
                pageDoc: {
                    ...page1,
                    content: {
                        ...page1.content,
                        fullText:
                            'Watch files for changes and rerun tests related to changed files',
                    },
                },
            })

            const { docs: after } = await search({ query })
            expect(after.length).toBe(1)
        })
    })

    test('delete pages by domain', async () => {
        const { docs: existingDocs } = await search({
            domains: ['test.com'],
        })
        expect(existingDocs.length).toBe(1)

        await index.delPagesByDomain('test.com')

        const { docs: deletedDocs } = await search({
            domains: ['test.com'],
        })
        expect(deletedDocs.length).toBe(0)
    })

    test('delete pages by pattern', async () => {
        const { docs: existingDocs } = await search({
            domains: ['lorem.com'],
        })
        expect(existingDocs.length).toBe(2)

        await index.delPagesByPattern(/lorem/i)

        const { docs: deletedDocs } = await search({
            domains: ['lorem.com'],
        })
        expect(deletedDocs.length).toBe(0)
    })
}

describe('Old search index integration', runSuite(true))
describe('New search index integration', runSuite(false))

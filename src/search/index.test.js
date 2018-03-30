/* eslint-env jest */

import memdown from 'memdown'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'

import normalizeUrl from 'src/util/encode-url-for-id'
import * as index from './'
import * as oldIndex from './search-index-old'
import * as newIndex from './search-index-new'
import { generatePageDocId } from 'src/page-storage'

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

async function insertData() {
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
}

async function resetData(dbName = 'test') {
    // Don't have any destroy methods available;
    //   => update pointer to memdown and manually delete fake-indexeddb's DB
    indexedDB.deleteDatabase(dbName)
    oldIndex.init({ levelDown: memdown() })
    newIndex.init({ indexedDB, IDBKeyRange, dbName })

    await insertData()
}

// Runs the same tests for either the new or old index
const runSuite = useOld => () => {
    // Old model uses page IDs (derived from URL), new model simply uses URL
    const createId = url =>
        useOld ? generatePageDocId({ url }) : normalizeUrl(url)

    const expected1 = createId(page1.url)
    const expected2 = createId(page2.url)
    const expected3 = createId(page3.url)

    // Some things may be broken in old one, but no plans on fixing
    const testOnlyNew = useOld ? test.skip : test

    // Bind common search params
    const search = params => {
        // Map the old result objects to KVP [ID, score] array style of new results
        const mapResultsFunc = useOld
            ? async results => results.map(res => [res.id, res.score])
            : async results => results

        return index.search({ mapResultsFunc, ...params })
    }

    beforeAll(async () => {
        index.getBackend._reset({ useOld })
        await resetData()
    })

    describe('read ops', () => {
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
            expect(docsA[0]).toEqual([expected2, bookmark1])

            // Lower-bound
            const { docs: docsB } = await search({ startDate: visit1 })

            // All other data should be older
            expect(docsB.length).toBe(1)
            expect(docsB[0]).toEqual([expected1, visit1])

            // Both bounds
            const { docs: docsC } = await search({
                startDate: visit3,
                endDate: visit2,
            })

            // Should be in order of visit
            expect(docsC.length).toBe(2)
            expect(docsC[0]).toEqual([expected2, visit2])
            expect(docsC[1]).toEqual([expected3, visit3])
        })

        test('time-filtered + terms search', async () => {
            const runChecks = docs => {
                expect(docs.length).toBe(2)
                expect(docs[0]).toEqual([expected2, visit2])
                expect(docs[1]).toEqual([expected3, visit3])
            }

            const { docs: docsA } = await search({
                endDate: visit2,
                query: 'consectetur adipiscing',
            })

            expect(docsA.length).toBe(1)
            expect(docsA[0]).toEqual([expected3, visit3])

            const { docs: docsB } = await search({
                startDate: visit3,
                query: 'lorem ipsum',
            })
            runChecks(docsB)

            const { docs: docsC } = await search({
                startDate: visit3,
                endDate: visit2,
                query: 'lorem ipsum',
            })
            runChecks(docsC)
        })

        test('time-filtered + terms + tags search', async () => {
            const { docs } = await search({
                startDate: visit3,
                endDate: visit2,
                query: 'lorem ipsum',
                tags: ['quality'],
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([expected2, visit2])
        })

        // Score is wrong on old version; it will still have score == visit2
        testOnlyNew(
            'time-filtered + terms + tags + bookmarks search',
            async () => {
                const { docs } = await search({
                    startDate: bookmark1,
                    endDate: visit2,
                    query: 'lorem ipsum',
                    tags: ['quality'],
                    showOnlyBookmarks: true,
                })

                expect(docs.length).toBe(1)
                expect(docs[0]).toEqual([expected2, bookmark1])
            },
        )

        test('time-filtered + terms + domains search', async () => {
            const { docs } = await search({
                startDate: visit3,
                endDate: visit2,
                query: 'lorem ipsum',
                domains: ['lorem.com'],
            })

            expect(docs.length).toBe(2)
            expect(docs[0]).toEqual([expected2, visit2])
            expect(docs[1]).toEqual([expected3, visit3])
        })

        test('time-filtered + terms + domains + tags search', async () => {
            const { docs } = await search({
                startDate: visit3,
                endDate: visit2,
                query: 'lorem ipsum',
                domains: ['lorem.com'],
                tags: ['quality'],
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([expected2, visit2])
        })

        test('paginated search', async () => {
            // Blank search but skipping the first 2 most-recent and only returning the 3rd
            const { docs: docsA } = await search({ skip: 2, limit: 2 })

            expect(docsA.length).toBe(1)
            expect(docsA[0]).toEqual([expected3, visit3])

            // Skip passed the end
            const { docs: docsB } = await search({ skip: 10 })
            expect(docsB.length).toBe(0)
        })

        const testDomains = (singleDomain, multiDomain) => async () => {
            const { docs: loremDocs } = await search(singleDomain)

            expect(loremDocs.length).toBe(2)
            expect(loremDocs[0]).toEqual([expected2, visit2])
            expect(loremDocs[1]).toEqual([expected3, visit3])

            // Multi-domain
            const { docs: testDocs } = await search(multiDomain)

            expect(testDocs.length).toBe(3)
            expect(testDocs[0]).toEqual([expected1, visit1])
            expect(testDocs[1]).toEqual([expected2, visit2])
            expect(testDocs[2]).toEqual([expected3, visit3])
        }

        test(
            'domains search (query)',
            testDomains(
                { query: 'lorem.com' },
                { query: 'lorem.com test.com' },
            ),
        )

        test(
            'domains search (filter)',
            testDomains(
                { domains: ['lorem.com'] },
                { domains: ['lorem.com', 'test.com'] },
            ),
        )

        test('domains suggest', async () => {
            const expected1 = ['lorem.com']
            expect(await index.suggest('l', 'domain')).toEqual(expected1)
            expect(await index.suggest('lo', 'domain')).toEqual(expected1)
            expect(await index.suggest('lol', 'domain')).not.toEqual(expected1)

            const expected2 = ['test.com']
            expect(await index.suggest('t', 'domain')).toEqual(expected2)
            expect(await index.suggest('te', 'domain')).toEqual(expected2)
            expect(await index.suggest('tet', 'domain')).not.toEqual(expected2)
        })

        test('tags suggest', async () => {
            const expected1 = ['quality']
            expect(await index.suggest('q', 'tag')).toEqual(expected1)
            expect(await index.suggest('qu', 'tag')).toEqual(expected1)
            expect(await index.suggest('quq', 'tag')).not.toEqual(expected1)

            const expected2 = ['good']
            expect(await index.suggest('g', 'tag')).toEqual(expected2)
            expect(await index.suggest('go', 'tag')).toEqual(expected2)
            expect(await index.suggest('gog', 'tag')).not.toEqual(expected2)
        })

        test('blank search', async () => {
            const { docs } = await search()

            // All docs, latest first
            expect(docs.length).toBe(3)
            expect(docs[0]).toEqual([expected1, visit1])
            expect(docs[1]).toEqual([expected2, visit2])
            expect(docs[2]).toEqual([expected3, visit3])
        })

        test('tags search', async () => {
            const runChecks = docs => {
                expect(docs.length).toBe(2)
                expect(docs[0]).toEqual([expected1, visit1])
                expect(docs[1]).toEqual([expected2, visit2])
            }

            // Single tag
            const { docs: qualityDocs } = await search({ tags: ['quality'] })
            runChecks(qualityDocs)

            // Multi tag
            const { docs: multiDocs } = await search({
                tags: ['quality', 'good'],
            })
            runChecks(multiDocs) // Same checks should pass as both contain these tags
        })

        test('bookmarks search', async () => {
            const { docs } = await search({ showOnlyBookmarks: true })

            // We only have a single bookmark
            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([expected2, bookmark1])
        })
    })

    describe('read-write ops', () => {
        // These tests will change the index data, so reset each time to avoid side-effects from other tests
        beforeEach(resetData)

        test('page adding affects search', async () => {
            const tmpPage = { ...page1, url: 'https://test.com/tmp' }
            const tmpExpected = createId(tmpPage.url)
            const tmpVisit = Date.now()

            // Insert a tmp page
            await index.addPage({
                pageDoc: tmpPage,
                visits: [tmpVisit],
            })

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // First result should be the new page
            expect(docs[0]).toEqual([tmpExpected, tmpVisit])
            expect(docs.length).toBe(4)

            // Expects from prev test should no longer pass
            expect(docs.length).not.toBe(3)
            expect(docs[0]).not.toEqual([expected1, visit1])
            expect(docs[1]).not.toEqual([expected2, visit2])
            expect(docs[2]).not.toEqual([expected3, visit3])
        })

        test('visit adding affects search', async () => {
            const { docs: before } = await search()

            expect(before.length).toBe(3)
            expect(before[0]).toEqual([expected1, visit1])

            const newVisit = Date.now()
            await index.addVisit(page2.url, newVisit)

            const { docs: after } = await search()

            expect(after.length).toBe(3)
            // First doc should now be page2, as we added new visit for now
            expect(after[0]).toEqual([expected2, newVisit])
        })

        test('page deletion affects search', async () => {
            const { docs: before } = await search()

            // Page 2 should be the second most recent
            expect(before.length).toBe(3)
            expect(before).toEqual(
                expect.arrayContaining([[expected2, visit2]]),
            )

            // so delete it
            await index.delPages([page2.url])

            const { docs: after } = await search()

            // Page 2 should now be excluded from blank search results
            expect(after.length).toBe(2)
            expect(after).not.toEqual(
                expect.arrayContaining([[expected2, visit2]]),
            )
        })

        test('tag adding affects search', async () => {
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).not.toEqual(
                expect.arrayContaining([[expected3, visit3]]),
            )

            // This page doesn't have any tags; 'quality' tag has 2 other pages
            await index.addTag(page3.url, 'quality')

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(3)
            expect(after).toEqual(expect.arrayContaining([[expected3, visit3]]))
        })

        test('tag deleting affects search', async () => {
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).toEqual(
                expect.arrayContaining([[expected2, visit2]]),
            )

            await index.delTag(page2.url, 'quality')

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(1)
            expect(after).not.toEqual(
                expect.arrayContaining([[expected2, visit2]]),
            )
        })

        test('bookmark adding affects search', async () => {
            const tmpBm = Date.now()
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // Base test data expectation
            expect(before.length).toBe(1)
            expect(before).toEqual(
                expect.arrayContaining([[expected2, bookmark1]]),
            ) // Base test data expectation

            // Add bm to 3rd test page
            await index.addBookmark({ url: page3.url, timestamp: tmpBm })
            const { docs } = await search({ showOnlyBookmarks: true })

            expect(docs.length).toBe(2)
            // Latest result should be from the recent bookmark event
            expect(docs[0]).toEqual([expected3, tmpBm])
            // Second-latest result should be our orig test bookmark data (latest before)
            expect(docs[1]).toEqual([expected2, bookmark1])
        })

        test('bookmark deleting affects search', async () => {
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // We only have a single bookmark
            expect(before.length).toBe(1)
            expect(before[0]).toEqual([expected2, bookmark1])

            // Add bm to 3rd test page
            await index.delBookmark({ url: page2.url })

            const { docs: after } = await search({ showOnlyBookmarks: true })
            expect(after.length).toBe(0) // Bye
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
    })
}

describe('Old search index integration', runSuite(true))
describe('New search index integration', runSuite(false))

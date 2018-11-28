import * as expect from 'expect'
import getDb, * as index from '.'
import * as DATA from './index.test.data'

const indexedDB = require('fake-indexeddb')
const iDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')

jest.mock('./storex')
jest.mock('./models/abstract-model')
jest.mock('lodash/fp/intersection')
jest.mock('lodash/fp/flatten')
jest.mock('lodash/fp/difference')

describe('Search index integration', () => {
    async function insertTestData() {
        // Insert some test data for all tests to use
        await index.addPage({ pageDoc: DATA.PAGE_3, visits: [DATA.VISIT_3] })
        await index.addPage({
            pageDoc: DATA.PAGE_2,
            visits: [DATA.VISIT_2],
            bookmark: DATA.BOOKMARK_1,
        })
        await index.addPage({ pageDoc: DATA.PAGE_1, visits: [DATA.VISIT_1] })

        // Add some test tags
        await index.addTag({ url: DATA.PAGE_3.url, tag: 'good' })
        await index.addTag({ url: DATA.PAGE_3.url, tag: 'quality' })
        await index.addTag({ url: DATA.PAGE_2.url, tag: 'quality' })
    }

    async function resetTestData(dbName = 'test') {
        indexedDB.deleteDatabase(dbName)

        await insertTestData()
    }

    // Bind projecting-out just ID and score from results to search
    const search = (params = {}) =>
        index.search({
            mapResultsFunc: res => res.map(([id, score]) => [id, score]),
            ...params,
        } as any)

    // Set what index to use for tests + initialize data
    beforeAll(async () => {
        await resetTestData()
    })

    describe('read ops', () => {
        test('fetch page by URL', async () => {
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
                expect(currPage.hasBookmark).toBe(false)
                expect(currPage.tags).toEqual(['good', 'quality'])

                expect(currPage.latest).toEqual(DATA.VISIT_3)
            }

            await runChecks(await index.getPage(DATA.PAGE_3.url))
            await runChecks(await index.getPage('test.com/test')) // Should get normalized the same

            const page = await index.getPage(DATA.PAGE_2.url)

            expect(page).toBeDefined()
            expect(page).not.toBeNull()
            expect(page.hasBookmark).toBe(true)
            expect(page.latest).toEqual(DATA.VISIT_2)
        })

        test('single term search', async () => {
            const { docs } = await search({ query: 'fox' })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
        })

        test('multi-term search', async () => {
            const { docs } = await search({
                query: 'fox wild',
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
        })

        test('boosted title term search', async () => {
            // Term appears in both test pages 1 and 2, but is in title of 1
            const { docs: docsTitle } = await search({ query: 'dummy' })

            expect(docsTitle.length).toBe(2)
            // First score will be multipled
            expect(docsTitle[0]).toEqual([
                DATA.PAGE_ID_1,
                Math.trunc(DATA.VISIT_1 * 1.2),
            ])
            expect(docsTitle[1]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
        })

        test('boosted url term search', async () => {
            // Term appears in page 3's URL
            const { docs: docsTitle } = await search({ query: 'test' })

            expect(docsTitle.length).toBe(1)
            expect(docsTitle[0]).toEqual([
                DATA.PAGE_ID_3,
                Math.trunc(DATA.VISIT_3 * 1.1),
            ])
        })

        test('time-filtered blank search', async () => {
            // Upper-bound
            const { docs: docsA } = await search({ endDate: DATA.BOOKMARK_1 })

            // All other data should be more recent
            expect(docsA.length).toBe(1)
            expect(docsA[0]).toEqual([DATA.PAGE_ID_2, DATA.BOOKMARK_1])

            // Lower-bound
            const { docs: docsB } = await search({ startDate: DATA.VISIT_3 })

            // All other data should be older
            expect(docsB.length).toBe(1)
            expect(docsB[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])

            // Both bounds
            const { docs: docsC } = await search({
                startDate: DATA.VISIT_1,
                endDate: DATA.VISIT_2,
            })

            // Should be in order of visit
            expect(docsC.length).toBe(2)
            expect(docsC[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(docsC[1]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
        })

        test('time-filtered + terms search', async () => {
            const runChecks = docs => {
                expect(docs.length).toBe(2)
                expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
                expect(docs[1]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
            }

            const { docs: docsA } = await search({
                endDate: DATA.VISIT_2,
                query: 'consectetur adipiscing',
            })

            expect(docsA.length).toBe(1)
            expect(docsA[0]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])

            const { docs: docsB } = await search({
                startDate: DATA.VISIT_1,
                query: 'lorem ipsum',
            })
            runChecks(docsB)

            const { docs: docsC } = await search({
                startDate: DATA.VISIT_1,
                endDate: DATA.VISIT_2,
                query: 'lorem ipsum',
            })
            runChecks(docsC)
        })

        test('time-filtered + terms + tags search', async () => {
            const { docs } = await search({
                startDate: DATA.VISIT_1,
                endDate: DATA.VISIT_2,
                query: 'lorem ipsum',
                tags: ['quality'],
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
        })

        test('time-filtered + terms + tags + bookmarks search', async () => {
            const { docs } = await search({
                startDate: DATA.BOOKMARK_1,
                endDate: DATA.VISIT_2,
                query: 'lorem ipsum',
                tags: ['quality'],
                showOnlyBookmarks: true,
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
        })

        // NOTE: some differences with how domain filtering works in new index
        test('time-filtered + terms + domains search', async () => {
            const { docs } = await search({
                startDate: DATA.VISIT_1,
                endDate: DATA.VISIT_2,
                query: 'lorem ipsum',
                domains: ['lorem.com'],
            })

            expect(docs.length).toBe(2)

            expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(docs[1]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
        })

        // NOTE: some differences with how domain filtering works in new index
        test('time-filtered + terms + domains + tags search', async () => {
            const { docs } = await search({
                startDate: DATA.VISIT_1,
                endDate: DATA.VISIT_2,
                query: 'lorem ipsum',
                domains: ['sub.lorem.com'],
                tags: ['quality'],
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
        })

        test('paginated search', async () => {
            // Blank search but skipping the first 2 most-recent and only returning the 3rd
            const { docs: docsA } = await search({ skip: 2, limit: 2 })

            expect(docsA.length).toBe(1)
            expect(docsA[0]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])

            // Skip passed the end
            const { docs: docsB } = await search({ skip: 10 })
            expect(docsB.length).toBe(0)
        })

        // NOTE: some differences with how domain filtering works in new index
        const testDomains = (singleQuery, multiQuery) => async () => {
            const { docs: loremDocs } = await search(singleQuery)

            expect(loremDocs.length).toBe(2)
            expect(loremDocs[0]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(loremDocs[1]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])

            // Multi-domain
            const { docs: testDocs } = await search(multiQuery)

            expect(testDocs.length).toBe(3)
            expect(testDocs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
            expect(testDocs[1]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(testDocs[2]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
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

        test('(sub)domains search', async () => {
            const { docs: domainDocs } = await search({
                domains: ['lorem.com'],
            })
            const { docs: subDocs } = await search({
                domains: ['sub.lorem.com'],
            })
            const { docs: combinedDocs } = await search({
                domains: ['lorem.com', 'sub.lorem.com'],
            })

            // Same as domain search encompasses all subdomains; we may add scoring later
            expect(domainDocs).toEqual(combinedDocs)

            // Subdomain search should not return docs on same domain but different subdomain
            expect(domainDocs).not.toEqual(subDocs)
            expect(subDocs).toEqual([[DATA.PAGE_ID_2, DATA.VISIT_2]])
        })

        test('domains exclusion search', async () => {
            const { docs: a } = await search({
                domainsExclude: ['test.com'],
            })

            expect(a).toEqual([
                [DATA.PAGE_ID_2, DATA.VISIT_2],
                [DATA.PAGE_ID_1, DATA.VISIT_1],
            ])

            // Effectively the same query
            const { docs: b } = await search({
                query: '-test.com',
            })

            expect(b).toEqual(a)
        })

        test('terms exclusion search', async () => {
            const { docs: a } = await search({
                query: 'page -lorem',
            })

            expect(a).toEqual([
                [DATA.PAGE_ID_3, Math.trunc(DATA.VISIT_3 * 1.2)],
            ])

            const { docs: b } = await search({
                query: 'page -lorem -wild',
            })

            expect(b).toEqual([])
        })

        const testTags = (singleQuery, multiQuery) => async () => {
            const runChecks = docs => {
                expect(docs.length).toBe(2)
                expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
                expect(docs[1]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            }

            // Single tag
            const { docs: qualityDocs } = await search(singleQuery)
            runChecks(qualityDocs)

            // Multi tag
            const { docs: multiDocs } = await search(multiQuery)
            runChecks(multiDocs) // Same checks should pass as both contain these tags
        }

        test(
            'tags search (query)',
            testTags({ query: '#quality' }, { query: '#quality #good' }),
        )
        test(
            'tags search (filter)',
            testTags({ tags: ['quality'] }, { tags: ['quality', 'good'] }),
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

            // New implementation should also support hostnames
            const expected3 = ['sub.lorem.com']
            expect(await index.suggest('s', 'domain')).toEqual(expected3)
            expect(await index.suggest('su', 'domain')).toEqual(expected3)
            expect(await index.suggest('sus', 'domain')).not.toEqual(expected3)
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
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
            expect(docs[1]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(docs[2]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
        })

        test('bookmarks search', async () => {
            const { docs } = await search({ showOnlyBookmarks: true })

            // We only have a single bookmark
            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_2, DATA.BOOKMARK_1])
        })
    })

    describe('read-write ops', () => {
        let origTimeout

        beforeEach(async () => {
            // These tests will change the index data, so reset each time to avoid side-effects from other tests
            await resetTestData()
            origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
        })

        afterEach(() => (jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout))

        test('add fav-icon', async () => {
            const db = await getDb
            const hostname1 = 'lorem.com'
            const hostname2 = 'sub.lorem.com'

            await index.addFavIcon(DATA.PAGE_1.url, DATA.FAV_1)
            await index.addFavIcon(DATA.PAGE_2.url, DATA.FAV_1)

            const fav1 = await db.favIcons.get(hostname1)
            const fav2 = await db.favIcons.get(hostname2)
            expect(fav1.hostname).toBe(hostname1)
            expect(fav2.hostname).toBe(hostname2)
        })

        test('page adding affects search', async () => {
            const tmpVisit = Date.now()
            // Insert a tmp page
            await index.addPage({
                pageDoc: DATA.PAGE_4,
                visits: [tmpVisit],
            })

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // First result should be the new page
            expect(docs[0]).toEqual([DATA.PAGE_ID_4, tmpVisit])
            expect(docs.length).toBe(4)

            // Expects from prev test should no longer pass
            expect(docs.length).not.toBe(3)
            expect(docs[0]).not.toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
            expect(docs[1]).not.toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(docs[2]).not.toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
        })

        test('visit adding affects search', async () => {
            const { docs: before } = await search()

            expect(before.length).toBe(3)
            expect(before[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])

            const newVisit = Date.now()
            await index.addVisit(DATA.PAGE_2.url, newVisit)

            const { docs: after } = await search()

            expect(after.length).toBe(3)
            // First doc should now be page2, as we added new visit for now
            expect(after[0]).toEqual([DATA.PAGE_ID_2, newVisit])
        })

        test('page deletion affects search', async () => {
            const { docs: before } = await search()

            // Page 2 should be the second most recent
            expect(before.length).toBe(3)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )

            // so delete it
            await index.delPages([DATA.PAGE_2.url])

            const { docs: after } = await search()

            // Page 2 should now be excluded from blank search results
            expect(after.length).toBe(2)
            expect(after).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )
        })

        test('tag adding affects search', async () => {
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_1, DATA.VISIT_1]]),
            )

            // This page doesn't have any tags; 'quality' tag has 2 other pages
            await index.addTag({ url: DATA.PAGE_1.url, tag: 'quality' })

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(3)
            expect(after).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_1, DATA.VISIT_1]]),
            )
        })

        test('tag deleting affects search', async () => {
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )

            await index.delTag({ url: DATA.PAGE_2.url, tag: 'quality' })

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(1)
            expect(after).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )
        })

        test('bookmark adding affects search', async () => {
            const tmpBm = Date.now()
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // Base test data expectation
            expect(before.length).toBe(1)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.BOOKMARK_1]]),
            ) // Base test data expectation

            // Add bm to 3rd test page
            await index.addBookmark({
                url: DATA.PAGE_1.url,
                timestamp: tmpBm,
            } as any)
            const { docs } = await search({ showOnlyBookmarks: true })

            expect(docs.length).toBe(2)
            // Latest result should be from the recent bookmark event
            expect(docs[0]).toEqual([DATA.PAGE_ID_1, tmpBm])
            // Second-latest result should be our orig test bookmark data (latest before)
            expect(docs[1]).toEqual([DATA.PAGE_ID_2, DATA.BOOKMARK_1])
        })

        test('bookmark deleting affects search', async () => {
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // We only have a single bookmark
            expect(before.length).toBe(1)
            expect(before[0]).toEqual([DATA.PAGE_ID_2, DATA.BOOKMARK_1])

            // Add bm to 3rd test page
            await index.delBookmark({ url: DATA.PAGE_2.url })

            const { docs: after } = await search({ showOnlyBookmarks: true })
            expect(after.length).toBe(0) // Bye
        })

        test('page terms adding affects search', async () => {
            const query = 'rerun tests changed files'
            const { docs: before } = await search({ query })
            expect(before.length).toBe(0)

            await index.addPageTerms({
                pageDoc: {
                    ...DATA.PAGE_3,
                    content: {
                        ...DATA.PAGE_3.content,
                        fullText:
                            'Watch files for changes and rerun tests related to changed files',
                    },
                },
            })

            const { docs: after } = await search({ query })
            expect(after.length).toBe(1)
        })

        test('page re-add appends new terms', async () => {
            const { docs: before } = await search({ query: 'fox' })
            expect(before.length).toBe(1)

            // Re-add page 3, but with new data (in-ext use case is page re-visit)
            await index.addPage({
                pageDoc: {
                    ...DATA.PAGE_3,
                    content: {
                        ...DATA.PAGE_3.content,
                        fullText: 'a group of pigs were shocked',
                    },
                },
            })

            // Should still match old text not in new page data
            const { docs: after } = await search({ query: 'fox' })
            expect(after.length).toBe(1)
        })

        test('delete pages by domain', async () => {
            const { docs: preDelete } = await search({
                domains: ['test.com'],
            })
            expect(preDelete.length).toBe(1)

            await index.delPagesByDomain('test.com')

            const { docs: postDelete } = await search({
                domains: ['test.com'],
            })

            expect(postDelete).not.toEqual(preDelete)
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
})

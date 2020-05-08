import * as DATA from './index.test.data'
import { FavIcon } from './models'
import { SearchIndex } from './types'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import StorageOperationLogger from 'src/tests/storage-operation-logger'
import TagStorage from 'src/tags/background/storage'
import TagsBackground from 'src/tags/background'

jest.mock('./models/abstract-model')
jest.mock('lodash/fp/intersection')
jest.mock('lodash/fp/flatten')
jest.mock('lodash/fp/difference')

describe('Search index integration', () => {
    async function setupTest(options?: { excludeTestData?: boolean }) {
        const {
            storageManager,
            backgroundModules,
        } = await setupBackgroundIntegrationTest()
        const { searchIndex } = backgroundModules.search

        if (!options?.excludeTestData) {
            await insertTestData(searchIndex, backgroundModules.tags)
        }
        return {
            storageManager,
            searchIndex,
            pages: backgroundModules.pages,
            tags: backgroundModules.tags,
            search: (params = {}) =>
                searchIndex.search({
                    mapResultsFunc: db => res => {
                        return res.map(([id, score]) => [id, score])
                    },
                    ...params,
                } as any),
        }
    }

    async function insertTestData(
        searchIndex: SearchIndex,
        tags: TagsBackground,
    ) {
        // Insert some test data for all tests to use
        await searchIndex.addPage({
            pageDoc: DATA.PAGE_3,
            visits: [DATA.VISIT_3],
        })
        await searchIndex.addPage({
            pageDoc: DATA.PAGE_2,
            visits: [DATA.VISIT_2],
            bookmark: DATA.BOOKMARK_1,
        })
        await searchIndex.addPage({
            pageDoc: DATA.PAGE_1,
            visits: [DATA.VISIT_1],
        })

        // // Add some test tags
        await tags.addTagToExistingUrl({ url: DATA.PAGE_3.url, tag: 'good' })
        await tags.addTagToExistingUrl({ url: DATA.PAGE_3.url, tag: 'quality' })
        await tags.addTagToExistingUrl({ url: DATA.PAGE_2.url, tag: 'quality' })
    }

    describe('read ops', () => {
        test('fetch page by URL', async () => {
            const { searchIndex } = await setupTest()
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
                expect(currPage.hasBookmark).toBe(false)
                expect(currPage.tags).toEqual(['good', 'quality'])

                expect(currPage.latest).toEqual(DATA.VISIT_3)
            }

            await runChecks(await searchIndex.getPage(DATA.PAGE_3.url))
            await runChecks(await searchIndex.getPage('test.com/test')) // Should get normalized the same

            const page = await searchIndex.getPage(DATA.PAGE_2.url)

            expect(page).toBeDefined()
            expect(page).not.toBeNull()
            expect(page.hasBookmark).toBe(true)
            expect(page.latest).toEqual(DATA.VISIT_2)
        })

        test('single term search', async () => {
            const { search } = await setupTest()
            const { docs } = await search({ query: 'fox' })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
        })

        test('multi-term search', async () => {
            const { search } = await setupTest()
            const { docs } = await search({
                query: 'fox wild',
            })

            expect(docs.length).toBe(1)
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
        })

        test('boosted title term search', async () => {
            const { search } = await setupTest()
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

        // TODO: Fix this feature
        test('boosted url term search', async () => {
            const { search } = await setupTest()
            // Term appears in page 3's URL
            const { docs: docsTitle } = await search({ query: 'test' })

            expect(docsTitle.length).toBe(1)
            expect(docsTitle[0]).toEqual([
                DATA.PAGE_ID_3,
                Math.trunc(DATA.VISIT_3 * 1.1),
            ])
        })

        test('time-filtered blank search', async () => {
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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
            const { search } = await setupTest()
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

        // TODO: Suggest code moved to storex plugin; Move these tests too
        // test('domains suggest', async () => {
        //     const expected1 = ['lorem.com']
        //     expect(await searchIndex.suggestaddTag('l', 'domain')).toEqual(expected1)
        //     expect(await searchIndex.suggestaddTag('lo', 'domain')).toEqual(expected1)
        //     expect(await searchIndex.suggestaddTag('lol', 'domain')).not.toEqual(
        //         expected1,
        //     )

        //     const expected2 = ['test.com']
        //     expect(await searchIndex.suggestaddTag('t', 'domain')).toEqual(expected2)
        //     expect(await searchIndex.suggestaddTag('te', 'domain')).toEqual(expected2)
        //     expect(await searchIndex.suggestaddTag('tet', 'domain')).not.toEqual(
        //         expected2,
        //     )

        //     // New implementation should also support hostnames
        //     const expected3 = ['sub.lorem.com']
        //     expect(await searchIndex.suggestaddTag('s', 'domain')).toEqual(expected3)
        //     expect(await searchIndex.suggestaddTag('su', 'domain')).toEqual(expected3)
        //     expect(await searchIndex.suggestaddTag('sus', 'domain')).not.toEqual(
        //         expected3,
        //     )
        // })

        // test('tags suggest', async () => {
        //     const expected1 = ['quality']
        //     expect(await searchIndex.suggestaddTag('q', 'tag')).toEqual(expected1)
        //     expect(await searchIndex.suggestaddTag('qu', 'tag')).toEqual(expected1)
        //     expect(await searchIndex.suggestaddTag('quq', 'tag')).not.toEqual(
        //         expected1,
        //     )

        //     const expected2 = ['good']
        //     expect(await searchIndex.suggestaddTag('g', 'tag')).toEqual(expected2)
        //     expect(await searchIndex.suggestaddTag('go', 'tag')).toEqual(expected2)
        //     expect(await searchIndex.suggestaddTag('gog', 'tag')).not.toEqual(
        //         expected2,
        //     )
        // })

        test('blank search', async () => {
            const { search } = await setupTest()
            const { docs } = await search()

            // All docs, latest first
            expect(docs.length).toBe(3)
            expect(docs[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])
            expect(docs[1]).toEqual([DATA.PAGE_ID_2, DATA.VISIT_2])
            expect(docs[2]).toEqual([DATA.PAGE_ID_1, DATA.VISIT_1])
        })

        test('bookmarks search', async () => {
            const { search } = await setupTest()
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
            // await insertTestData()
            origTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
        })

        afterEach(() => (jasmine.DEFAULT_TIMEOUT_INTERVAL = origTimeout))

        test('add page with extra data', async () => {
            const { searchIndex, storageManager, pages } = await setupTest()
            pages.storage.disableBlobProcessing = true

            await searchIndex.addPage({
                pageDoc: {
                    ...DATA.PAGE_1,
                    favIconURI: 'bla bla bla',
                },
                visits: [DATA.VISIT_1],
            })

            expect(
                await storageManager
                    .collection('pages')
                    .findObject({ url: DATA.PAGE_ID_1 }),
            ).toEqual({
                domain: 'lorem.com',
                fullTitle: 'page 3 dummy',
                fullUrl: 'https://www.lorem.com/test2',
                hostname: 'lorem.com',
                terms: expect.any(Array),
                text:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                titleTerms: expect.any(Array),
                url: 'lorem.com/test2',
                urlTerms: expect.any(Array),
            })
        })

        test('add page terms with extra data', async () => {
            const { searchIndex, storageManager, pages } = await setupTest()
            pages.storage.disableBlobProcessing = true

            await searchIndex.addPage({
                pageDoc: {
                    ...DATA.PAGE_1,
                },
                visits: [DATA.VISIT_1],
            })

            await searchIndex.addPageTerms({
                pageDoc: {
                    ...DATA.PAGE_1,
                    favIconURI: 'bla bla bla',
                },
            })

            expect(
                await storageManager
                    .collection('pages')
                    .findObject({ url: DATA.PAGE_ID_1 }),
            ).toEqual({
                domain: 'lorem.com',
                fullTitle: 'page 3 dummy',
                fullUrl: 'https://www.lorem.com/test2',
                hostname: 'lorem.com',
                terms: expect.any(Array),
                text:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                titleTerms: expect.any(Array),
                url: 'lorem.com/test2',
                urlTerms: expect.any(Array),
            })
        })

        test('add fav-icon', async () => {
            const { searchIndex, storageManager, pages } = await setupTest()
            pages.storage.disableBlobProcessing = true
            const hostname1 = 'lorem.com'
            const hostname2 = 'sub.lorem.com'

            await searchIndex.addFavIcon(DATA.PAGE_1.url, DATA.FAV_1)
            await searchIndex.addFavIcon(DATA.PAGE_2.url, DATA.FAV_1)

            const favIcons = await storageManager
                .collection('favIcons')
                .findObjects<FavIcon>({})
            expect(favIcons).toEqual([
                expect.objectContaining({ hostname: hostname1 }),
                expect.objectContaining({ hostname: hostname2 }),
            ])
        })

        test('page adding affects search', async () => {
            const { search, searchIndex } = await setupTest()
            const tmpVisit = Date.now()
            // Insert a tmp page
            await searchIndex.addPage({
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
            const { search, searchIndex } = await setupTest()
            const { docs: before } = await search()

            expect(before.length).toBe(3)
            expect(before[0]).toEqual([DATA.PAGE_ID_3, DATA.VISIT_3])

            const newVisit = Date.now()
            await searchIndex.addVisit(DATA.PAGE_2.url, newVisit)

            const { docs: after } = await search()

            expect(after.length).toBe(3)
            // First doc should now be page2, as we added new visit for now
            expect(after[0]).toEqual([DATA.PAGE_ID_2, newVisit])
        })

        test('page deletion affects search', async () => {
            const { search, searchIndex } = await setupTest()
            const { docs: before } = await search()

            // Page 2 should be the second most recent
            expect(before.length).toBe(3)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )

            // so delete it
            await searchIndex.delPages([DATA.PAGE_2.url])

            const { docs: after } = await search()

            // Page 2 should now be excluded from blank search results
            expect(after.length).toBe(2)
            expect(after).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )
        })

        test('tag adding affects search', async () => {
            const { search, tags } = await setupTest()
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_1, DATA.VISIT_1]]),
            )

            // This page doesn't have any tags; 'quality' tag has 2 other pages
            await tags.addTagToExistingUrl({
                url: DATA.PAGE_1.url,
                tag: 'quality',
            })

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(3)
            expect(after).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_1, DATA.VISIT_1]]),
            )
        })

        test('tag deleting affects search', async () => {
            const { search, tags } = await setupTest()
            const { docs: before } = await search({ tags: ['quality'] })
            expect(before.length).toBe(2)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )

            await tags.delTag({ url: DATA.PAGE_2.url, tag: 'quality' })

            const { docs: after } = await search({ tags: ['quality'] })
            expect(after.length).toBe(1)
            expect(after).not.toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.VISIT_2]]),
            )
        })

        test('bookmark adding affects search', async () => {
            const { search, searchIndex } = await setupTest()
            const tmpBm = Date.now()
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // Base test data expectation
            expect(before.length).toBe(1)
            expect(before).toEqual(
                expect.arrayContaining([[DATA.PAGE_ID_2, DATA.BOOKMARK_1]]),
            ) // Base test data expectation

            // Add bm to 3rd test page
            await searchIndex.addBookmark({
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
            const { search, searchIndex } = await setupTest()
            const { docs: before } = await search({ showOnlyBookmarks: true })

            // We only have a single bookmark
            expect(before.length).toBe(1)
            expect(before[0]).toEqual([DATA.PAGE_ID_2, DATA.BOOKMARK_1])

            // Add bm to 3rd test page
            await searchIndex.delBookmark({ url: DATA.PAGE_2.url })

            const { docs: after } = await search({ showOnlyBookmarks: true })
            expect(after.length).toBe(0) // Bye
        })

        test('page terms adding affects search', async () => {
            const { search, searchIndex } = await setupTest()
            const query = 'rerun tests changed files'
            const { docs: before } = await search({ query })
            expect(before.length).toBe(0)

            await searchIndex.addPageTerms({
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

        test('page does not duplicate text fields on updates', async () => {
            const { searchIndex } = await setupTest()
            const pageBefore = await searchIndex.getPage(DATA.PAGE_3.url)

            // Try a standard update without any changes
            await searchIndex.addPage({ pageDoc: DATA.PAGE_3 })

            const pageAfter1 = await searchIndex.getPage(DATA.PAGE_3.url)

            expect(pageAfter1.text.length).toBe(pageBefore.text.length)
            expect(pageAfter1.fullTitle.length).toBe(
                pageBefore.fullTitle.length,
            )
            expect(pageAfter1.fullUrl.length).toBe(pageBefore.fullUrl.length)

            // Try an update with a tag data change
            pageAfter1.addTag('test')
            await pageAfter1.save()

            const pageAfter2 = await searchIndex.getPage(DATA.PAGE_3.url)
            expect(pageAfter2.text.length).toBe(pageBefore.text.length)
            expect(pageAfter2.fullTitle.length).toBe(
                pageBefore.fullTitle.length,
            )
            expect(pageAfter2.fullUrl.length).toBe(pageBefore.fullUrl.length)
        })

        test('page re-add appends new terms on updates', async () => {
            const { search, searchIndex } = await setupTest()
            const { docs: before } = await search({ query: 'fox' })
            expect(before.length).toBe(1)

            // Re-add page 3, but with new data (in-ext use case is page re-visit)
            await searchIndex.addPage({
                pageDoc: {
                    ...DATA.PAGE_3,
                    content: {
                        ...DATA.PAGE_3.content,
                        fullText: 'a group of pigs were shocked',
                    },
                },
            })

            expect(await searchIndex.getPage(DATA.PAGE_3.url)).toMatchObject({
                domain: 'test.com',
                fullTitle: 'page',
                fullUrl: DATA.PAGE_3.url,
                hostname: 'test.com',
                terms: [
                    'group',
                    'pigs',
                    'shocked',
                    'wild',
                    'fox',
                    'jumped',
                    'hairy',
                    'red',
                    'hen',
                ],
                text: 'a group of pigs were shocked',
                titleTerms: ['page'],
                url: 'test.com/test',
                urlTerms: ['test'],
            })

            // Should still match old text not in new page data
            const { docs: after } = await search({ query: 'fox' })
            expect(after.length).toBe(1)
        })

        test('delete pages by domain', async () => {
            const { search, searchIndex } = await setupTest()
            // const { docs: preDelete } = await search({
            //     domains: ['test.com'],
            // })
            // expect(preDelete.length).toBe(1)
            // await index.delPagesByDomain('test.com')
            // const { docs: postDelete } = await search({
            //     domains: ['test.com'],
            // })
            // expect(postDelete).not.toEqual(preDelete)
        })

        test('delete pages by pattern', async () => {
            const { search } = await setupTest()
            const { docs: existingDocs } = await search({
                domains: ['lorem.com'],
            })
            expect(existingDocs.length).toBe(2)

            // await index.delPagesByPattern(/lorem/i)

            // const { docs: deletedDocs } = await search({
            //     domains: ['lorem.com'],
            // })
            // expect(deletedDocs.length).toBe(0)
        })
    })
})

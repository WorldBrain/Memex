/* eslint-env jest */

import memdown from 'memdown'

import * as index from './'
import * as oldIndex from './search-index-old'
import { generatePageDocId } from 'src/page-storage'

// Test data (TODO: better way to manage this?)
const visit1 = Date.now()
const visit2 = visit1 - 1000 * 60
const visit3 = visit2 - 1000 * 60
const bookmark1 = visit1 - 1000 * 60 * 86400 // Bookmark from a day ago
const input1 = {
    pageDoc: {
        url: 'https://www.test.com/test',
        content: {
            fullText: 'the wild fox jumped over the hairy red hen',
            title: 'test page',
        },
    },
    visits: [visit1.toString()],
}
const input2 = {
    pageDoc: {
        url: 'https://www.lorem.com/test1',
        content: {
            fullText:
                'Lorem Ipsum is simply dummy text of the printing industry',
            title: 'test page 2',
        },
    },
    bookmark: bookmark1,
    visits: [visit2.toString()],
}
const input3 = {
    pageDoc: {
        url: 'https://www.lorem.com/test2',
        content: {
            fullText:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            title: 'test page 3',
        },
    },
    visits: [visit3.toString()],
}

// We only care about ID of result; shape of data like terms, etc, not really relevant to search results
// TODO: move this away from page doc ID to normalized URL ID when running these tests with new index
const expected1 = {
    id: generatePageDocId({ url: input1.pageDoc.url }),
}
const expected2 = {
    id: generatePageDocId({ url: input2.pageDoc.url }),
}
const expected3 = {
    id: generatePageDocId({ url: input3.pageDoc.url }),
}

// Bind common search params
const search = params =>
    index.search({ mapResultsFunc: async x => x, ...params })

describe('Old search index integration', () => {
    beforeAll(async () => {
        index.getBackend._reset({ useOld: true })
        oldIndex.init({ levelDown: memdown() })

        // Insert some test data for all tests to use
        await index.addPage(input1)
        await index.addPage(input2)
        await index.addPage(input3)

        // Add some test tags
        await index.addTag('https://www.test.com/test', 'good')
        await index.addTag('https://www.test.com/test', 'quality')
        await index.addTag('https://www.lorem.com/test1', 'quality')
    })

    test('fetch page by URL', async () => {
        const runChecks = page => {
            expect(page).toBeDefined()
            expect(page).not.toBeNull()
            expect(page.hasBookmark).toBe(false)
            expect(page.latest).toEqual(visit1.toString())
            expect(page.tags).toEqual(['good', 'quality'])
        }

        runChecks(await index.getPage('https://www.test.com/test'))
        runChecks(await index.getPage('test.com/test')) // Should get normalized the same
    })

    test('single term search', async () => {
        const { docs } = await search({ query: 'fox' })

        expect(docs.length).toBe(1)
        expect(docs[0].document).toEqual(expect.objectContaining(expected1))
        expect(docs[0].score).toEqual(visit1.toString())
    })

    test('multi-term search', async () => {
        const { docs } = await search({
            query: 'fox wild',
        })

        expect(docs.length).toBe(1)
        expect(docs[0].document).toEqual(expect.objectContaining(expected1))

        expect(docs[0].score).toEqual(visit1.toString())
    })

    test('time-filtered blank search', async () => {
        // Upper-bound
        const { docs: docsA } = await search({ endDate: bookmark1 })

        // All other data should be more recent
        expect(docsA.length).toBe(1)
        expect(docsA[0].document).toEqual(expect.objectContaining(expected2))
        expect(docsA[0].score).toEqual(bookmark1.toString())

        // Lower-bound
        const { docs: docsB } = await search({ startDate: visit1 })

        // All other data should be older
        expect(docsB.length).toBe(1)
        expect(docsB[0].document).toEqual(expect.objectContaining(expected1))
        expect(docsB[0].score).toEqual(visit1.toString())

        // Both bounds
        const { docs: docsC } = await search({
            startDate: visit3,
            endDate: visit2,
        })

        // Should be in order of visit
        expect(docsC.length).toBe(2)
        expect(docsC[0].document).toEqual(expect.objectContaining(expected2))
        expect(docsC[1].document).toEqual(expect.objectContaining(expected3))
    })

    test('paginated search', async () => {
        // Blank search but skipping the first 2 most-recent and only returning the 3rd
        const { docs: docsA } = await search({ skip: 2, limit: 2 })

        expect(docsA.length).toBe(1)
        expect(docsA[0].document).toEqual(expect.objectContaining(expected3))
        expect(docsA[0].score).toEqual(visit3.toString())

        // Skip passed the end
        const { docs: docsB } = await search({ skip: 10 })
        expect(docsB.length).toBe(0)
    })

    test('domains search', async () => {
        const { docs: loremDocs } = await search({ domains: ['lorem.com'] })

        expect(loremDocs.length).toBe(2)
        expect(loremDocs[0].document).toEqual(
            expect.objectContaining(expected2),
        )
        expect(loremDocs[1].document).toEqual(
            expect.objectContaining(expected3),
        )

        // Multi-domain
        const { docs: testDocs } = await search({
            domains: ['lorem.com', 'test.com'],
        })
        expect(testDocs.length).toBe(3)
        expect(testDocs[0].document).toEqual(expect.objectContaining(expected1))
        expect(testDocs[1].document).toEqual(expect.objectContaining(expected2))
        expect(testDocs[2].document).toEqual(expect.objectContaining(expected3))
    })

    async function testBlankSearch() {
        const { docs } = await search()

        // All docs, latest first
        expect(docs.length).toBe(3)
        expect(docs[0].document).toEqual(expect.objectContaining(expected1))
        expect(docs[1].document).toEqual(expect.objectContaining(expected2))
        expect(docs[2].document).toEqual(expect.objectContaining(expected3))
    }

    async function testTagsSearch() {
        const runChecks = docs => {
            expect(docs.length).toBe(2)
            expect(docs[0].document).toEqual(expect.objectContaining(expected1))
            expect(docs[1].document).toEqual(expect.objectContaining(expected2))
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
        expect(docs[0].document).toEqual(expect.objectContaining(expected2))
        expect(docs[0].score).toEqual(bookmark1.toString())
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
            ...input1.pageDoc,
            url: 'https://www.test.com/delete-me',
        }
        const tmpExpected = {
            id: generatePageDocId({ url: tmpPage.url }),
        }

        test('page adding affects search', async () => {
            // Insert a tmp page
            await index.addPage({
                pageDoc: tmpPage,
                visits: [tmpVisit.toString()],
            })

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // First result should be the new page
            expect(docs[0].document).toEqual(
                expect.objectContaining(tmpExpected),
            )
            expect(docs.length).toBe(4)
            expect(docs[0].score).toEqual(tmpVisit.toString())

            // Expects from prev test should no longer pass
            expect(docs.length).not.toBe(3)
            expect(docs[0].document).not.toEqual(
                expect.objectContaining(expected1),
            )
            expect(docs[1].document).not.toEqual(
                expect.objectContaining(expected2),
            )
            expect(docs[2].document).not.toEqual(
                expect.objectContaining(expected3),
            )
        })

        test('visit adding affects search', async () => {
            const visit = Date.now()
            await index.addVisit(tmpPage.url, visit)

            // Blank search to get all test data + new latest doc
            const { docs } = await search()

            // These should be the same
            expect(docs[0].document).toEqual(
                expect.objectContaining(tmpExpected),
            )
            expect(docs.length).toBe(4)

            // However the score should have changed
            expect(docs[0].score).not.toEqual(tmpVisit.toString())
            expect(docs[0].score).toEqual(visit.toString())
        })

        test('page deletion affects search', async () => {
            // Delete tmp page added from prev test then make sure same blank search test passes again
            await index.delPages([tmpPage.url])
            await testBlankSearch()
        })

        test('tag adding affects search', async () => {
            // This page doesn't have any tags; 'quality' tag has 2 other pages
            await index.addTag('https://www.lorem.com/test2', 'quality')

            const { docs } = await search({ tags: ['quality'] })
            expect(docs.length).not.toBe(2) // Base test data expectation
            expect(docs.length).toBe(3)
            expect(docs[2].document).toEqual(expect.objectContaining(expected3))
        })

        test('tag deleting affects search', async () => {
            await index.delTag('https://www.lorem.com/test2', 'quality')
            await testTagsSearch() // Should once again pass as we are now at original data state
        })

        test('bookmark adding affects search', async () => {
            // Add bm to 3rd test page
            await index.addBookmark({
                url: 'https://www.lorem.com/test2',
                timestamp: tmpBm,
            })

            const { docs } = await search({ showOnlyBookmarks: true })

            expect(docs.length).not.toBe(1) // Base test data expectation
            expect(docs.length).toBe(2)

            // Latest result should be from the recent bookmark event
            expect(docs[0].document).toEqual(expect.objectContaining(expected3))
            expect(docs[0].score).toEqual(tmpBm.toString())
        })

        test('bookmark deleting affects search', async () => {
            // Add bm to 3rd test page
            await index.delBookmark({ url: 'https://www.lorem.com/test2' })
            await testBookmarkSearch() // Base data bookmark test should now pass again
        })

        test('page terms adding affects search', async () => {
            const query = 'rerun tests changed files'
            const { docs: before } = await search({ query })
            expect(before.length).toBe(0)

            await index.addPageTerms({
                pageDoc: {
                    ...input1.pageDoc,
                    content: {
                        ...input1.pageDoc.content,
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
        const { docs: existingDocs } = await search({ domains: ['test.com'] })
        expect(existingDocs.length).toBe(1)

        await index.delPagesByDomain('test.com')

        const { docs: deletedDocs } = await search({ domains: ['test.com'] })
        expect(deletedDocs.length).toBe(0)
    })

    test('delete pages by pattern', async () => {
        const { docs: existingDocs } = await search({ domains: ['lorem.com'] })
        expect(existingDocs.length).toBe(2)

        await index.delPagesByPattern(/lorem/i)

        const { docs: deletedDocs } = await search({ domains: ['lorem.com'] })
        expect(deletedDocs.length).toBe(0)
    })
})

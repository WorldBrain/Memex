import StorageManager from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import * as DATA from './index.test.data'
import { PageUrlsByDay } from './types'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { BackgroundModules } from 'src/background-script/setup'
import { Annotation } from 'src/direct-linking/types'

const mockEvent = { addListener: () => undefined }

const countAnnots = res => {
    return res.docs.reduce(
        (count, { annotations }) => count + annotations.length,
        0,
    )
}

const flattenAnnotUrls = res => {
    return res.docs.reduce(
        (urls, { annotations }) => [...urls, ...annotations.map(a => a.url)],
        [],
    )
}

const flattenAnnotUrlsFromDayMap = (res: PageUrlsByDay) => {
    const urls: string[] = []

    for (const annotsByPageUrl of Object.values(res)) {
        const annots = Object.values(annotsByPageUrl) as Annotation[][]
        urls.push(...[].concat(...annots).map(a => a.url))
    }

    return urls
}

describe('Annotations search', () => {
    let coll1Id: number
    let coll2Id: number

    async function insertTestData({
        storageManager,
        backgroundModules,
    }: {
        storageManager: StorageManager
        backgroundModules: BackgroundModules
    }) {
        const annotsStorage = backgroundModules.directLinking.annotationStorage
        const customListsBg = backgroundModules.customLists

        for (const annot of [
            DATA.directLink,
            DATA.highlight,
            DATA.annotation,
            DATA.comment,
            DATA.hybrid,
        ]) {
            // Pages also need to be seeded to match domains filters against
            await storageManager.collection('pages').createObject({
                url: annot.pageUrl,
                hostname: normalizeUrl(annot.pageUrl),
                domain: normalizeUrl(annot.pageUrl),
                title: annot.pageTitle,
                text: annot.body,
                canonicalUrl: annot.url,
            })

            // Create a dummy visit 30 secs before annot creation time
            await storageManager.collection('visits').createObject({
                url: annot.pageUrl,
                time: new Date(annot.createdWhen.getTime() - 300000).getTime(),
            })

            await annotsStorage.createAnnotation(annot as any)
        }

        // Insert bookmarks
        await annotsStorage.toggleAnnotBookmark({
            url: DATA.directLink.url,
        })
        await annotsStorage.toggleAnnotBookmark({ url: DATA.hybrid.url })
        await annotsStorage.toggleAnnotBookmark({ url: DATA.highlight.url })

        // Insert collections + collection entries
        coll1Id = await customListsBg.createCustomList({
            name: DATA.coll1,
        })
        coll2Id = await customListsBg.createCustomList({
            name: DATA.coll2,
        })
        await customListsBg.insertPageToList({
            id: coll1Id,
            url: DATA.directLink.pageUrl,
        })
        await customListsBg.insertPageToList({
            id: coll2Id,
            url: DATA.highlight.pageUrl,
        })
        await annotsStorage.insertAnnotToList({
            listId: coll1Id,
            url: DATA.hybrid.url,
        })
        await annotsStorage.insertAnnotToList({
            listId: coll2Id,
            url: DATA.highlight.url,
        })

        // Insert tags
        await annotsStorage.modifyTags(true)(DATA.tag1, DATA.annotation.url)
        await annotsStorage.modifyTags(true)(DATA.tag2, DATA.annotation.url)

        // I don't know why this happens: seemingly only in jest,
        //  `getTagsByAnnotationUrl` returns one less result than it's meant to.
        //  The best fix I can find for now is adding a dummy tag...
        await annotsStorage.modifyTags(true)('dummy', DATA.annotation.url)
    }

    async function setupTest() {
        const setup = await setupBackgroundIntegrationTest({
            tabManager: {
                getActiveTab: () => ({ id: 1, url: 'test' }),
                getTabState: () => undefined,
                getTabStateByUrl: () => undefined,
            } as any,
        })
        await insertTestData(setup)

        return {
            searchBg: setup.backgroundModules.search,
            annotsBg: setup.backgroundModules.directLinking,
        }
    }

    describe('terms-based searches', () => {
        test('plain terms search', async () => {
            const { searchBg } = await setupTest()

            const resA = await searchBg.searchAnnotations({
                query: 'comment',
            })
            expect(countAnnots(resA)).toBe(2)
            expect(flattenAnnotUrls(resA)).toEqual(
                expect.arrayContaining([DATA.comment.url, DATA.annotation.url]),
            )

            const resB = await searchBg.searchAnnotations({
                query: 'bla',
            })
            expect(countAnnots(resB)).toBe(2)
            expect(flattenAnnotUrls(resB)).toEqual(
                expect.arrayContaining([DATA.hybrid.url, DATA.annotation.url]),
            )
        })

        test('bookmarks filter', async () => {
            const { searchBg } = await setupTest()

            const resFiltered = await searchBg.searchAnnotations({
                query: 'bla',
                bookmarksOnly: true,
            })
            expect(countAnnots(resFiltered)).toBe(1)
            expect(flattenAnnotUrls(resFiltered)).toEqual(
                expect.arrayContaining([DATA.hybrid.url]),
            )

            const resUnfiltered = await searchBg.searchAnnotations({
                query: 'bla',
                bookmarksOnly: false,
            })
            expect(countAnnots(resUnfiltered)).toBe(2)
            expect(flattenAnnotUrls(resUnfiltered)).toEqual(
                expect.arrayContaining([DATA.hybrid.url, DATA.annotation.url]),
            )
        })

        test('collections filter', async () => {
            const { searchBg } = await setupTest()

            const resA = await searchBg.searchAnnotations({
                query: 'quote',
                lists: [coll1Id],
            } as any)

            expect(countAnnots(resA)).toBe(1)

            const resB = await searchBg.searchAnnotations({
                query: 'quote',
                lists: [9999999], // Not a real collection ID
            } as any)

            expect(countAnnots(resB)).toBe(0)
        })

        test('tags filter', async () => {
            const { searchBg } = await setupTest()

            const resFiltered = await searchBg.searchAnnotations({
                query: 'comment',
                tagsInc: [DATA.tag1],
            })
            expect(countAnnots(resFiltered)).toBe(1)
            expect(flattenAnnotUrls(resFiltered)).toEqual(
                expect.arrayContaining([DATA.annotation.url]),
            )

            const resUnfiltered = await searchBg.searchAnnotations({
                query: 'comment',
            })
            expect(countAnnots(resUnfiltered)).toBe(2)
            expect(flattenAnnotUrls(resUnfiltered)).toEqual(
                expect.arrayContaining([DATA.annotation.url, DATA.comment.url]),
            )
        })

        test('domains filter', async () => {
            const { searchBg } = await setupTest()

            const resUnfiltered = await searchBg.searchAnnotations({
                query: 'highlight',
            })
            expect(countAnnots(resUnfiltered)).toBe(2)
            expect(flattenAnnotUrls(resUnfiltered)).toEqual(
                expect.arrayContaining([DATA.hybrid.url, DATA.highlight.url]),
            )

            const resExc = await searchBg.searchAnnotations({
                query: 'highlight',
                domainsExclude: ['annotation.url'],
            })
            expect(countAnnots(resExc)).toBe(1)
            expect(flattenAnnotUrls(resExc)).toEqual(
                expect.arrayContaining([DATA.hybrid.url]),
            )

            const resInc = await searchBg.searchAnnotations({
                query: 'highlight',
                domains: ['annotation.url'],
            })
            expect(countAnnots(resInc)).toBe(1)
            expect(flattenAnnotUrls(resInc)).toEqual(
                expect.arrayContaining([DATA.highlight.url]),
            )
        })

        test('page result limit parameter', async () => {
            const { searchBg } = await setupTest()

            const single = await searchBg.searchAnnotations({
                query: 'term',
                limit: 1,
            })
            const double = await searchBg.searchAnnotations({
                query: 'term',
                limit: 2,
            })
            const triple = await searchBg.searchAnnotations({
                query: 'term',
                limit: 3,
            })

            expect(single.docs.length).toBe(1)
            expect(double.docs.length).toBe(2)
            expect(triple.docs.length).toBe(3)
        })

        test('comment-terms only terms search', async () => {
            const { searchBg } = await setupTest()

            const resCommentsOnly = await searchBg.searchAnnotations({
                query: 'term',
                contentTypes: { highlights: false, notes: true, pages: false },
            })
            expect(countAnnots(resCommentsOnly)).toBe(1)
            expect(flattenAnnotUrls(resCommentsOnly)).toEqual(
                expect.arrayContaining([DATA.hybrid.url]),
            )

            const resAllFields = await searchBg.searchAnnotations({
                query: 'term',
            })
            expect(countAnnots(resAllFields)).toBe(3)
            expect(flattenAnnotUrls(resAllFields)).toEqual(
                expect.arrayContaining([
                    DATA.hybrid.url,
                    DATA.directLink.url,
                    DATA.comment.url,
                ]),
            )
        })

        test('highlighted-text-terms only terms search', async () => {
            const { searchBg } = await setupTest()

            const resBodyOnly = await searchBg.searchAnnotations({
                query: 'term',
                contentTypes: { highlights: true, notes: false, pages: false },
            })
            expect(countAnnots(resBodyOnly)).toBe(2)
            expect(flattenAnnotUrls(resBodyOnly)).toEqual(
                expect.arrayContaining([DATA.directLink.url, DATA.comment.url]),
            )

            const resAllFields = await searchBg.searchAnnotations({
                query: 'term',
            })
            expect(countAnnots(resAllFields)).toBe(3)
            expect(flattenAnnotUrls(resAllFields)).toEqual(
                expect.arrayContaining([
                    DATA.hybrid.url,
                    DATA.directLink.url,
                    DATA.comment.url,
                ]),
            )
        })
    })

    describe('URL-based searches', () => {
        test('blank', async () => {
            const { annotsBg } = await setupTest()

            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                { url: DATA.pageUrl },
            )
            expect(results.length).toBe(3)
            expect(results.map(a => a.url)).toEqual(
                expect.arrayContaining([
                    DATA.highlight.url,
                    DATA.annotation.url,
                    DATA.comment.url,
                ]),
            )
        })

        test('bookmarks filter', async () => {
            const { annotsBg } = await setupTest()

            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                { url: DATA.pageUrl, bookmarksOnly: true },
            )
            expect(results.length).toBe(1)
            expect(results.map(a => a.url)).toEqual(
                expect.arrayContaining([DATA.highlight.url]),
            )
        })

        test('tags included filter', async () => {
            const { annotsBg } = await setupTest()

            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                {
                    url: DATA.pageUrl,
                    tagsInc: [DATA.tag1],
                },
            )
            expect(results.length).toBe(1)
            expect(results.map(a => a.url)).toEqual(
                expect.arrayContaining([DATA.annotation.url]),
            )
        })

        test('tags excluded filter', async () => {
            const { annotsBg } = await setupTest()

            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                {
                    url: DATA.pageUrl,
                    tagsExc: [DATA.tag1, DATA.tag2, 'dummy'],
                },
            )
            expect(results.length).toBe(0)
        })

        test('collections filter', async () => {
            const { annotsBg } = await setupTest()

            const resA = await annotsBg.getAllAnnotationsByUrl({ tab: null }, {
                url: DATA.pageUrl,
                collections: [coll2Id],
            } as any)
            expect(resA.length).toBe(3)
            expect(resA.map(a => a.url)).toEqual(
                expect.arrayContaining([
                    DATA.highlight.url,
                    DATA.annotation.url,
                    DATA.comment.url,
                ]),
            )

            const resB = await annotsBg.getAllAnnotationsByUrl({ tab: null }, {
                url: DATA.directLink.pageUrl,
                collections: [coll1Id],
            } as any)
            expect(resB.length).toBe(1)
            expect(resB.map(a => a.url)).toEqual(
                expect.arrayContaining([DATA.directLink.url]),
            )
        })
    })

    describe('blank searches', () => {
        test('all content types search', async () => {
            const { searchBg } = await setupTest()

            const { docs: results } = await searchBg.searchPages({
                contentTypes: { highlights: true, notes: true, pages: true },
            })
            expect(results.length).toBe(3)

            // Ensure order is by latest visit
            expect(results.map(res => res.url)).toEqual([
                DATA.hybrid.pageUrl,
                DATA.highlight.pageUrl,
                DATA.directLink.pageUrl,
            ])
        })

        test('annots-only search', async () => {
            const { searchBg } = await setupTest()

            const {
                annotsByDay: results,
                resultsExhausted,
            }: any = await searchBg.searchAnnotations({})

            const resUrls = flattenAnnotUrlsFromDayMap(results)
            expect(resultsExhausted).toBe(true)
            expect(resUrls.length).toBe(5)
            // Ensure order of pages is by latest annot
            expect(resUrls).toEqual(
                expect.arrayContaining([
                    DATA.hybrid.url,
                    DATA.comment.url,
                    DATA.highlight.url,
                    DATA.annotation.url,
                    DATA.directLink.url,
                ]),
            )
        })

        test('time filters', async () => {
            const { searchBg } = await setupTest()

            // Should result in only the newest annot
            const { annotsByDay: resA }: any = await searchBg.searchAnnotations(
                {
                    startDate: new Date('2019-01-30'),
                },
            )

            const resAUrls = flattenAnnotUrlsFromDayMap(resA)
            expect(resAUrls.length).toBe(1)
            expect(resAUrls).toEqual(expect.arrayContaining([DATA.hybrid.url]))

            // Should result in only the oldest annot
            const { annotsByDay: resB }: any = await searchBg.searchAnnotations(
                {
                    endDate: new Date('2019-01-26'),
                },
            )

            const resBUrls = flattenAnnotUrlsFromDayMap(resB)
            expect(resBUrls.length).toBe(1)
            expect(resBUrls).toEqual(
                expect.arrayContaining([DATA.highlight.url]),
            )

            // Should result in only the oldest annot
            const { annotsByDay: resC }: any = await searchBg.searchAnnotations(
                {
                    startDate: new Date('2019-01-25'),
                    endDate: new Date('2019-01-28T23:00Z'),
                },
            )

            const resCUrls = flattenAnnotUrlsFromDayMap(resC)
            expect(resCUrls.length).toBe(2)
            expect(resCUrls).toEqual(
                expect.arrayContaining([DATA.comment.url, DATA.highlight.url]),
            )
        })

        test('tags filter', async () => {
            const { searchBg } = await setupTest()

            const {
                annotsByDay: results,
                resultsExhausted,
            }: any = await searchBg.searchAnnotations({
                tagsInc: [DATA.tag1],
            })

            const resUrls = flattenAnnotUrlsFromDayMap(results)
            expect(resultsExhausted).toBe(true)
            expect(resUrls.length).toBe(1)

            expect(resUrls).toEqual([DATA.annotation.url])
        })
    })
})

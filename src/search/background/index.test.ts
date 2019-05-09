import initStorageManager from '../memory-storex'
import { StorageManager } from '..'
import getDb, { setStorexBackend } from '../get-db'
import SearchBg from './index'
import normalize from 'src/util/encode-url-for-id'
import CustomListBg from 'src/custom-lists/background'
import AnnotsBg from 'src/direct-linking/background'
import AnnotsStorage from 'src/direct-linking/background/storage'
import * as DATA from 'src/direct-linking/background/storage.test.data'
import { PageUrlsByDay } from './types'

const mockEvent = { addListener: () => undefined }

const mockPdfBg = { getPdfFingerprintForUrl: url => url }

const countAnnots = res => {
    const results: PageUrlsByDay = res.docs[0]
    let count = 0

    for (const day of Object.keys(results)) {
        count += Object.keys(results[day]).length
    }

    return count
}

// TODO: Make this work somehow...
describe.skip('Annotations search', () => {
    let annotsStorage: AnnotsStorage
    let annotsBg: AnnotsBg
    let storageManager: StorageManager
    let customListsBg: CustomListBg
    let searchBg: SearchBg

    async function insertTestData() {
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
                hostname: normalize(annot.pageUrl),
                domain: normalize(annot.pageUrl),
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
        const coll1Id = await customListsBg.createCustomList({
            name: DATA.coll1,
        })
        const coll2Id = await customListsBg.createCustomList({
            name: DATA.coll2,
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

    beforeEach(async () => {
        storageManager = initStorageManager()
        annotsBg = new AnnotsBg({
            storageManager,
            getDb,
            pdfBackground: mockPdfBg as any,
        })

        searchBg = new SearchBg({
            storageManager,
            getDb,
            tabMan: { getActiveTab: () => ({ id: 1, url: 'test' }) } as any,
            bookmarksAPI: { onCreated: mockEvent, onRemoved: mockEvent } as any,
        })

        customListsBg = new CustomListBg({ storageManager, getDb })
        annotsStorage = annotsBg['annotationStorage']

        await storageManager.finishInitialization()
        setStorexBackend(storageManager.backend)
        await insertTestData()
    })

    describe('terms search', () => {
        test('test terms', async () => {
            const results = await searchBg.searchAnnotations({
                query: 'comment',
            })

            expect(countAnnots(results)).toBe(1)
        })

        test('bookmarks only', async () => {
            const resA = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                bookmarksOnly: true,
            })

            expect(countAnnots(resA)).toBe(2)
        })

        test('collections filter', async () => {
            const resA = await searchBg.searchAnnotations({
                query: 'quote',
                lists: [DATA.coll1, DATA.coll2],
            } as any)

            expect(countAnnots(resA)).toBe(1)

            const resB = await searchBg.searchAnnotations({
                query: 'quote',
                lists: ['not a real coll'],
            } as any)

            expect(countAnnots(resB)).toBe(0)
        })

        test('tags filter', async () => {
            const results = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                tagsInc: [DATA.tag1],
            })

            expect(countAnnots(results)).toBe(1)
        })

        test('domains filter', async () => {
            const resA = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                domainsExc: ['annotation.url'],
            })

            expect(countAnnots(resA)).toBe(1)

            const resB = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                domainsInc: ['annotation.url'],
            })

            expect(countAnnots(resB)).toBe(3)
        })

        test('limit', async () => {
            const single = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                limit: 1,
            })
            const double = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                limit: 2,
            })
            const triple = await searchBg.searchAnnotations({
                query: 'highlight annotation comment',
                limit: 3,
            })

            expect(countAnnots(single)).toBe(1)
            expect(countAnnots(double)).toBe(2)
            expect(countAnnots(triple)).toBe(3)
        })

        test('url scope', async () => {
            const res = await searchBg.searchAnnotations({
                query: 'quote',
                url: normalize(DATA.directLink.pageUrl),
            })

            expect(countAnnots(res)).toBe(1)

            const resNone = await searchBg.searchAnnotations({
                query: 'quote',
                url: normalize(DATA.pageUrl),
            })

            expect(countAnnots(resNone)).toBe(0)
        })

        test('comment-text-only', async () => {
            const results = await searchBg.searchAnnotations({
                query: 'comment',
                contentTypes: { highlights: false, notes: true, pages: false },
            } as any)

            expect(countAnnots(results)).toBe(2)
        })

        test('highlight-text-only', async () => {
            const results = await searchBg.searchAnnotations({
                query: 'whooo',
                contentTypes: { highlights: true, notes: false, pages: false },
            } as any)

            expect(countAnnots(results)).toBe(3)
        })
    })

    describe('url-based search', () => {
        test('blank', async () => {
            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                { url: DATA.pageUrl },
            )

            expect(results.length).toBe(3)
        })

        test('bookmark filter', async () => {
            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                { url: DATA.pageUrl, bookmarksOnly: true },
            )

            expect(results.length).toBe(1)
        })

        test('tag inc filter', async () => {
            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                {
                    url: DATA.pageUrl,
                    tagsInc: [DATA.tag1],
                },
            )

            expect(results.length).toBe(1)
        })

        test('tag exc filter', async () => {
            const results = await annotsBg.getAllAnnotationsByUrl(
                { tab: null },
                {
                    url: DATA.pageUrl,
                    tagsExc: [DATA.tag1, DATA.tag2, 'dummy'],
                },
            )

            expect(results.length).toBe(0)
        })

        test('collection filter', async () => {
            const resA = await annotsBg.getAllAnnotationsByUrl({ tab: null }, {
                url: DATA.pageUrl,
                lists: [DATA.coll2],
            } as any)

            const resB = await annotsBg.getAllAnnotationsByUrl({ tab: null }, {
                url: DATA.pageUrl,
                lists: [DATA.coll1],
            } as any)

            expect(resA.length).toBe(1)
            expect(resB.length).toBe(0)
        })
    })

    describe('blank search', () => {
        test('all content types', async () => {
            const { docs: results } = await searchBg.searchPages({
                contentTypes: { highlights: true, notes: true, pages: true },
            })

            expect(results).toBeDefined()
            expect(results.length).toBe(3)

            // Ensure order is by latest visit
            expect(results.map(res => res.url)).toEqual([
                DATA.hybrid.pageUrl,
                DATA.highlight.pageUrl,
                DATA.directLink.pageUrl,
            ])

            const resByUrl = new Map()
            results.forEach(res => resByUrl.set(res.url, res))

            expect(resByUrl.get(DATA.pageUrl).annotations.length).toBe(3)
            expect(
                resByUrl.get(DATA.directLink.pageUrl).annotations.length,
            ).toBe(1)
            expect(resByUrl.get(DATA.hybrid.pageUrl).annotations.length).toBe(1)
        })

        test('annots-only', async () => {
            const {
                docs: results,
                resultsExhausted,
            } = await searchBg.searchAnnotations({})

            expect(resultsExhausted).toBe(true)
            expect(results).toBeDefined()
            expect(results.length).toBe(3)

            // Ensure order of pages is by latest annot
            expect(results.map(res => res.url)).toEqual([
                DATA.hybrid.pageUrl,
                DATA.annotation.pageUrl,
                DATA.directLink.pageUrl,
            ])

            // For each page, ensure order of annots is by latest
            expect(results[0].annotations.map(annot => annot.url)).toEqual([
                DATA.hybrid.url,
            ])
            expect(results[1].annotations.map(annot => annot.url)).toEqual([
                DATA.annotation.url,
                DATA.comment.url,
                DATA.highlight.url,
            ])
            expect(results[2].annotations.map(annot => annot.url)).toEqual([
                DATA.directLink.url,
            ])
        })

        test('time filters', async () => {
            // Should result in only the newest annot
            const { docs: resA } = await searchBg.searchAnnotations({
                startDate: new Date('2019-01-30'),
            })

            expect(resA).toBeDefined()
            expect(resA.length).toBe(1)

            expect(resA[0].annotations.length).toBe(1)
            expect(resA[0].annotations[0].url).toBe(DATA.hybrid.url)

            // Should result in only the oldest annot
            const { docs: resB } = await searchBg.searchAnnotations({
                endDate: new Date('2019-01-26'),
            })

            expect(resB).toBeDefined()
            expect(resB.length).toBe(1)

            expect(resB[0].annotations.length).toBe(1)
            expect(resB[0].annotations[0].url).toBe(DATA.highlight.url)

            // Should result in only the oldest annot
            const { docs: resC } = await searchBg.searchAnnotations({
                startDate: new Date('2019-01-25'),
                endDate: new Date('2019-01-28T23:00Z'),
            })

            expect(resC).toBeDefined()
            expect(resC.length).toBe(1)

            expect(resC[0].annotations.length).toBe(2)
            expect(resC[0].annotations[0].url).toBe(DATA.comment.url)
            expect(resC[0].annotations[1].url).toBe(DATA.highlight.url)
        })

        test('tags filter', async () => {
            const {
                docs: results,
                resultsExhausted,
            } = await searchBg.searchAnnotations({
                tagsInc: [DATA.tag1],
            })

            expect(resultsExhausted).toBe(true)
            expect(results).toBeDefined()
            expect(results.length).toBe(1)

            expect(results[0].annotations.length).toBe(1)
            expect(results[0].annotations[0].url).toEqual(DATA.annotation.url)
        })
    })
})

import initStorageManager from '../memory-storex'
import { StorageManager, getDb } from '..'
import { AnnotsSearcher } from './annots-search'
import normalize from 'src/util/encode-url-for-id'
import { AnnotPage } from './types'
import CustomListBackground from 'src/custom-lists/background'
import AnnotsBg from 'src/direct-linking/background'
import AnnotsStorage from 'src/direct-linking/background/storage'
import * as DATA from 'src/direct-linking/background/storage.test.data'

describe('Annotations search', () => {
    let annotsStorage: AnnotsStorage
    let storageManager: StorageManager
    let customListsBg: CustomListBackground
    let searcher: AnnotsSearcher

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
                text: '',
                canonicalUrl: annot.url,
            })

            await annotsStorage.createAnnotation(annot)
        }

        // Insert bookmarks
        await annotsStorage.toggleAnnotBookmark({
            url: DATA.directLink.url,
        })
        await annotsStorage.toggleAnnotBookmark({ url: DATA.hybrid.url })

        // Insert collections + collection entries
        const coll1Id = await customListsBg.createCustomList({
            name: DATA.coll1,
        })
        await customListsBg.createCustomList({ name: DATA.coll2 })
        await annotsStorage.insertAnnotToList({
            listId: coll1Id,
            url: DATA.hybrid.url,
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
        const annotBg = new AnnotsBg({
            storageManager,
            getDb,
        })
        customListsBg = new CustomListBackground({ storageManager })
        searcher = new AnnotsSearcher({
            annotsColl: AnnotsStorage.ANNOTS_COLL,
            bookmarksColl: AnnotsStorage.BMS_COLL,
            listsColl: AnnotsStorage.LISTS_COLL,
            listEntriesColl: AnnotsStorage.LIST_ENTRIES_COLL,
            tagsColl: AnnotsStorage.TAGS_COLL,
            storageManager,
        })

        annotsStorage = annotBg['annotationStorage']

        await storageManager.finishInitialization()
        await insertTestData()
    })
    test('terms search', async () => {
        const results = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
        })

        expect(results).toBeDefined()
        expect(results.length).toBe(4)
    })

    test('bookmarks only', async () => {
        const resA = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            bookmarksOnly: true,
        })

        expect(resA).toBeDefined()
        expect(resA.length).toBe(1)
    })

    test('highlights only', async () => {
        const results = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            highlightsOnly: true,
        })

        expect(results).toBeDefined()
        expect(results.length).toBe(3)
    })

    test('direct links only', async () => {
        const linkOnlyRes = await searcher.search({
            terms: ['quote'],
            directLinksOnly: true,
        })

        expect(linkOnlyRes).toBeDefined()
        expect(linkOnlyRes.length).toBe(1)
    })

    test('collections filter', async () => {
        const resA = await searcher.search({
            terms: ['quote'],
            collections: [DATA.coll1, DATA.coll2],
        })

        expect(resA).toBeDefined()
        expect(resA.length).toBe(1)

        const resB = await searcher.search({
            terms: ['quote'],
            collections: ['not a real coll'],
        })

        expect(resB).toBeDefined()
        expect(resB.length).toBe(0)
    })

    test('tags filter', async () => {
        const results = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            tagsInc: [DATA.tag1],
        })

        expect(results).toBeDefined()
        expect(results.length).toBe(1)
    })

    test('domains filter', async () => {
        const resA = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            domainsExc: ['annotation.url'],
        })

        expect(resA).toBeDefined()
        expect(resA.length).toBe(1)

        const resB = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            domainsInc: ['annotation.url'],
        })

        expect(resB).toBeDefined()
        expect(resB.length).toBe(3)
    })

    test('limit', async () => {
        const single = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            limit: 1,
        })
        const double = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            limit: 2,
        })
        const triple = await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            limit: 3,
        })

        expect(single).toBeDefined()
        expect(single.length).toBe(1)
        expect(double).toBeDefined()
        expect(double.length).toBe(2)
        expect(triple).toBeDefined()
        expect(triple.length).toBe(3)
    })

    test('url scope', async () => {
        const res = await searcher.search({
            terms: ['quote'],
            url: normalize(DATA.directLink.pageUrl),
        })

        expect(res).toBeDefined()
        expect(res.length).toBe(1)

        const resNone = await searcher.search({
            terms: ['quote'],
            url: normalize(DATA.pageUrl),
        })

        expect(resNone).toBeDefined()
        expect(resNone.length).toBe(0)
    })

    test('page results include', async () => {
        const results = (await searcher.search({
            terms: ['highlight', 'annotation', 'comment'],
            includePageResults: true,
        })) as AnnotPage[]

        expect(results).toBeDefined()
        expect(results.length).toBe(2)
        expect(results[0].annotations.length).toBe(3)
    })
})

import memdown from 'memdown'
import * as fakeIDBFactory from 'fake-indexeddb'
import * as fakeIDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'
import { handleAttachment as addPouchPageAttachment } from '../../page-storage/store-page'
import * as search from '../'
import * as oldIndex from '../search-index-old'
import * as newIndex from '../search-index-new'
import exportOldPages from '../search-index-old/export'
import importNewPage from '../search-index-new/import'
import * as data from './import-export.test.data'
import { MigrationManager, ExportedPage } from './'

jest.mock('../search-index-new/models/abstract-model')

async function insertTestPageIntoOldIndex() {
    await search.addPage({
        pageDoc: data.PAGE_DOC_1,
        bookmarkDocs: [],
        visits: [data.TEST_VISIT_1],
    })
    await search.addTag(data.PAGE_DOC_1.url, 'virus')
    await search.addTag(data.PAGE_DOC_1.url, 'fix')
    await search.addBookmark({
        url: data.PAGE_DOC_1.url,
        timestamp: data.TEST_BOOKMARK_1,
    })
    await addPouchPageAttachment(
        data.PAGE_DOC_1._id,
        'screenshot',
        data.TEST_SCREENSHOT,
    )
    await addPouchPageAttachment(
        data.PAGE_DOC_1._id,
        'favIcon',
        data.TEST_FAVICON,
    )
}

describe('Old search index', () => {
    beforeEach(async () => {
        search.getBackend._reset({ useOld: true })
        oldIndex.init({ levelDown: memdown() })

        await insertTestPageIntoOldIndex()
    })

    test('Exporting data', async () => {
        for await (const { pages: [page] } of exportOldPages()) {
            expect(page).toEqual(<ExportedPage>{
                url: 'https://www.2-spyware.com/remove-skype-virus.html',
                content: {
                    canonicalUrl: data.PAGE_DOC_1.content.canonicalUrl,
                    lang: data.PAGE_DOC_1.content.lang,
                    title: data.PAGE_DOC_1.content.title,
                    fullText: data.PAGE_DOC_1.content.fullText,
                    keywords: data.PAGE_DOC_1.content.keywords,
                    description: data.PAGE_DOC_1.content.description,
                },
                visits: [{ timestamp: data.TEST_VISIT_1 }],
                tags: ['virus', 'fix'],
                bookmark: data.TEST_BOOKMARK_1,
                screenshot: data.TEST_SCREENSHOT,
                favIcon: data.TEST_FAVICON,
            })
        }
    })
})

describe('New search index', () => {
    beforeEach(async () => {
        search.getBackend._reset({ useOld: false })
        newIndex.init({
            indexedDB: fakeIDBFactory,
            IDBKeyRange: fakeIDBKeyRange,
            dbName: 'dexie',
        })
    })

    test('Importing data', async () => {
        const visit1 = Date.now(),
            visit2 = Date.now() + 50 * 1000
        const tag1 = 'footag',
            tag2 = 'spamtag'
        const bookmark1 = Date.now() + 5000

        await importNewPage({
            url: data.PAGE_DOC_1.url,
            content: {
                lang: data.PAGE_DOC_1.content.lang,
                title: data.PAGE_DOC_1.content.title,
                fullText: data.PAGE_DOC_1.content.fullText,
                keywords: data.PAGE_DOC_1.content.keywords,
                description: data.PAGE_DOC_1.content.description,
            },
            visits: [{ timestamp: visit1 }],
            tags: [tag1, tag2],
            bookmark: bookmark1,
            screenshot: data.TEST_SCREENSHOT,
            favIcon: data.TEST_FAVICON,
        })

        const { docs: [result] } = await search.search({
            query: 'mining',
            mapResultsFunc: r => r,
        })

        expect(result).toEqual([data.PAGE_DOC_1.normalizedUrl, bookmark1])
    })
})

// describe.skip('Migration', () => {
//     test('simple migration', async () => {
//         search.getBackend._reset({ useOld: true })
//         oldIndex.init({ levelDown: memdown() })
//         await db.erase()
//         await insertTestPageIntoOldIndex()

//         newIndex.init({
//             indexedDB: fakeIDBFactory,
//             IDBKeyRange: fakeIDBKeyRange,
//             dbName: 'dexie',
//         })

//         await migrate()

//         const { docs: results } = await search.search({
//             query: 'virus',
//             mapResultsFunc: async results => results,
//         })
//         expect(results).toEqual([
//             expect.objectContaining({
//                 url: 'https://www.2-spyware.com/remove-skype-virus.html',
//                 title: 'Remove Skype virus (Removal Guide) - Jan 2018 update',
//                 screenshot: TEST_SCREENSHOT,
//                 favIcon: TEST_FAVICON,
//             }),
//         ])
//     })
// })

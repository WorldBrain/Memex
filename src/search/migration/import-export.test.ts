import memdown from 'memdown'
import * as fakeIDBFactory from 'fake-indexeddb'
import * as fakeIDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'
import db from '../../pouchdb'
import { handleAttachment as addPouchPageAttachment } from '../../page-storage/store-page'
import * as search from './'
import * as oldIndex from '../search-index-old'
import * as newIndex from '../search-index-new'
import exportOldPages from '../search-index-old/export'
import importNewPage from '../search-index-new/import'
import migrate, { ExportedPage } from './'
import * as testData from './import-export.test.data'

const TEST_VISIT_1 = Date.now()
const TEST_BOOKMARK_1 = Date.now() + 5000
const TEST_SCREENSHOT = 'data:image/png;base64,notreallyascreenshot'
const TEST_FAVICON = 'data:image/png;base64,notreallyanicon'

async function insertTestPageIntoOldIndex() {
    await db.put(testData.PAGE_DOC_1)
    await search.addPage({
        pageDoc: testData.PAGE_DOC_1,
        bookmarkDocs: [],
        visits: [TEST_VISIT_1],
    })
    await search.addTag(testData.PAGE_DOC_1.url, 'virus')
    await search.addTag(testData.PAGE_DOC_1.url, 'fix')
    await search.addBookmark({
        url: testData.PAGE_DOC_1.url,
        timestamp: TEST_BOOKMARK_1,
        tabId: 25,
    })
    await addPouchPageAttachment(
        testData.PAGE_DOC_1._id,
        'screenshot',
        TEST_SCREENSHOT,
    )
    await addPouchPageAttachment(
        testData.PAGE_DOC_1._id,
        'favicon',
        TEST_FAVICON,
    )
}

describe.skip('Old search index', () => {
    test('Exporting data', async () => {
        search.getBackend._reset({ useOld: true })
        oldIndex.init({ levelDown: memdown() })
        await db.erase()
        await insertTestPageIntoOldIndex()

        const exportChunk = exportOldPages({ chunkSize: 10 }).next
        const exported = []
        while (true) {
            const chunk = await exportChunk()
            if (!chunk) {
                break
            }
            exported.push(...chunk)
        }

        expect(exported).toEqual([
            <ExportedPage>{
                url: 'https://www.2-spyware.com/remove-skype-virus.html',
                content: {
                    lang: testData.PAGE_DOC_1.content.lang,
                    title: testData.PAGE_DOC_1.content.title,
                    fullText: testData.PAGE_DOC_1.content.fullText,
                    keywords: testData.PAGE_DOC_1.content.keywords,
                    description: testData.PAGE_DOC_1.content.description,
                },
                visits: [{ timestamp: TEST_VISIT_1 }],
                tags: ['virus', 'fix'],
                bookmark: TEST_BOOKMARK_1,
                screenshot: TEST_SCREENSHOT,
                favIcon: TEST_FAVICON,
            },
        ])
    })
})

describe.skip('New search index', () => {
    test('Importing data', async () => {
        search.getBackend._reset({ useOld: false })
        newIndex.init({
            indexedDB: fakeIDBFactory,
            IDBKeyRange: fakeIDBKeyRange,
            dbName: 'dexie',
        })
        const visit1 = Date.now(),
            visit2 = Date.now() + 50 * 1000
        const tag1 = 'footag',
            tag2 = 'spamtag'
        const bookmark1 = Date.now() + 5000
        await importNewPage({
            url: 'https://www.2-spyware.com/remove-skype-virus.html',
            content: {
                lang: testData.PAGE_DOC_1.content.lang,
                title: testData.PAGE_DOC_1.content.title,
                fullText: testData.PAGE_DOC_1.content.fullText,
                keywords: testData.PAGE_DOC_1.content.keywords,
                description: testData.PAGE_DOC_1.content.description,
            },
            visits: [{ timestamp: visit1 }],
            tags: [tag1, tag2],
            bookmark: bookmark1,
            screenshot: TEST_SCREENSHOT,
            favIcon: TEST_FAVICON,
        })
        const { docs: results } = await search.search({
            query: 'interesting',
            mapResultsFunc: async results => results,
        })
        expect(results).toEqual([
            expect.objectContaining({
                url: 'https://www.test.com?q=test',
                title: 'very interesting futile title',
                screenshot: TEST_SCREENSHOT,
                favIcon: TEST_FAVICON,
            }),
        ])
    })
})

describe.skip('Migration', () => {
    test('simple migration', async () => {
        search.getBackend._reset({ useOld: true })
        oldIndex.init({ levelDown: memdown() })
        await db.erase()
        await insertTestPageIntoOldIndex()

        newIndex.init({
            indexedDB: fakeIDBFactory,
            IDBKeyRange: fakeIDBKeyRange,
            dbName: 'dexie',
        })

        await migrate()

        const { docs: results } = await search.search({
            query: 'virus',
            mapResultsFunc: async results => results,
        })
        expect(results).toEqual([
            expect.objectContaining({
                url: 'https://www.2-spyware.com/remove-skype-virus.html',
                title: 'Remove Skype virus (Removal Guide) - Jan 2018 update',
                screenshot: TEST_SCREENSHOT,
                favIcon: TEST_FAVICON,
            }),
        ])
    })
})

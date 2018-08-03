import memdown from 'memdown'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'
import { handleAttachment as addPouchPageAttachment } from '../../page-storage/store-page'
import index from '../'
import * as oldIndex from '../search-index-old'
import * as newIndex from '../search-index-new'
import exportOldPages from '../search-index-old/export'
import importNewPage from '../search-index-new/import'
import { searchOld } from '../search-index-old/api'
import * as data from './import-export.test.data'
import { MigrationManager } from './migration-manager'
import { ExportedPage } from './types'

jest.mock('../search-index-new/models/abstract-model')

async function insertTestPageIntoOldIndex() {
    index.useOld = true

    await index.addPage({
        pageDoc: data.PAGE_DOC_1,
        visits: [data.TEST_VISIT_1],
    })
    await Promise.all(
        data.EXPORTED_PAGE_1.tags.map(tag =>
            index.addTag({ url: data.PAGE_DOC_1.url, tag }),
        ),
    )
    await index.addBookmark({
        url: data.PAGE_DOC_1.url,
        timestamp: data.TEST_BOOKMARK_1,
    } as any)
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

async function resetDataSources(dbName = 'test') {
    // Don't have any destroy methods available;
    //   => update pointer to memdown and manually delete fake-indexeddb's DB
    indexedDB.deleteDatabase(dbName)
    oldIndex.init({ levelDown: memdown() })
    newIndex.init({ indexedDB, IDBKeyRange, dbName })
}

describe('Old=>New index migration', () => {
    describe('read ops', () => {
        beforeAll(async () => {
            await resetDataSources()
            await insertTestPageIntoOldIndex()
        })

        test.skip('Exporting old-index data', async () => {
            for await (const {
                pages: [page],
            } of exportOldPages()) {
                expect(page).toEqual(data.EXPORTED_PAGE_1)
            }
        })
    })

    describe('read-write ops', () => {
        beforeEach(async () => {
            await resetDataSources()
            await insertTestPageIntoOldIndex()
        })

        // Try to find the page data stored for given test data from DB - check everything
        async function testStoredPage(expectedData: Partial<ExportedPage>) {
            const storedPage = await newIndex.default.pages.get(
                expectedData.url,
            )

            const {
                visits,
                screenshotURI,
                favIconURI,
                bookmark,
                tags,
                ...expected
            } = expectedData
            const { screenshot, ...page } = storedPage

            // Test standard data
            expect(page).toEqual(expected)

            // Test assoc. data via getters
            await storedPage.loadRels()
            expect(storedPage.screenshotURI).toBe(screenshotURI)
            expect(storedPage.hasBookmark).toBe(true)
            expect(storedPage.bookmark.time).toBe(bookmark)

            expect(storedPage.tags).toEqual(expect.arrayContaining(tags))
            expect(storedPage.visits.map(visit => visit.time)).toEqual(
                expect.arrayContaining(visits.map(visit => visit.time)),
            )

            await newIndex.default.favIcons
                .get(expectedData.hostname)
                .then(storedFav => {
                    if (storedFav) {
                        expect(storedFav.hostname).toBe(page.hostname)
                        expect(storedFav.favIconURI).toBe(favIconURI)
                    }
                })
        }

        test.skip('Importing data to new index', async () => {
            await importNewPage(data.EXPORTED_PAGE_1 as ExportedPage)

            index.useOld = false
            // Make sure search works post-import
            const {
                docs: [result],
            } = await index.search({
                query: 'mining',
                mapResultsFunc: r => r,
            } as any)

            expect(result).toEqual([
                data.PAGE_DOC_1.normalizedUrl,
                data.TEST_BOOKMARK_1,
            ])

            // Test against the new Page + FavIcon from the DB
            await testStoredPage(data.EXPORTED_PAGE_1)
        })

        test.skip('Simple full migration', async () => {
            // Set up to do same search, resolving to first result
            const doSearch = () => {
                const run = index.useOld ? searchOld : index.search
                return run({
                    query: 'virus',
                    mapResultsFunc: results =>
                        results.map(([id, time, doc]) => [id, time]),
                } as any).then(res => res.docs[0])
            }

            index.useOld = true
            const oldResult = await doSearch()
            expect(oldResult[0]).toEqual(data.PAGE_DOC_1._id)

            // Perform migration then reset the backend to point to new index
            await new MigrationManager({}).start()
            index.useOld = false

            // New index should get same doc with updated unencoded URL ID
            const newResultPostMigration = await doSearch()
            expect(newResultPostMigration[0]).toEqual(data.EXPORTED_PAGE_1.url)

            // Test against the new Page + FavIcon from the DB
            await testStoredPage(data.EXPORTED_PAGE_1)
        })
    })
})

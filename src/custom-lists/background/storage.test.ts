import CustomListBackground from './'
import Storage from '../../search/search-index-new/storage'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'
import * as DATA from './storage.test.data'
import { StorageManager } from '../../search/search-index-new/storage/manager'

const runSuite = () => () => {
    // New storage manager instance
    const storageManagerL = new StorageManager()
    const fakeIndex = new CustomListBackground({
        storageManager: storageManagerL,
    })
    async function insertTestData() {
        // Insert some test data for all tests to use
        await fakeIndex.createCustomList(DATA.LIST_1)
        await fakeIndex.createCustomList(DATA.LIST_2)
        await fakeIndex.createCustomList(DATA.LIST_3)

        await fakeIndex.insertPageToList(DATA.PAGE_ENTRY_1)
        await fakeIndex.insertPageToList(DATA.PAGE_ENTRY_2)
        await fakeIndex.insertPageToList(DATA.PAGE_ENTRY_3)
        await fakeIndex.insertPageToList(DATA.PAGE_ENTRY_4)
    }
    // insertTestData()
    async function resetTestData(dbName = 'Memex') {
        indexedDB.deleteDatabase(dbName)
        const StorageL = new Storage({
            indexedDB,
            IDBKeyRange,
            dbName,
            storageManager: storageManagerL,
        })
        // Passing fake IndexedDB to the storage manager
        storageManagerL._finishInitialization(StorageL)

        await insertTestData()
    }

    beforeAll(async () => {
        await resetTestData()
    })

    describe('read ops', () => {
        test('fetch All Lists', async () => {
            const lists = await fakeIndex.fetchAllLists({})

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(3)
        })

        test('fetch Pages associated with list', async () => {
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
            }

            runChecks(await fakeIndex.fetchListPagesById({ id: 1 }))
            const lists = await fakeIndex.fetchListPagesById({ id: 1 })

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(2)
        })

        test('fetch suggestions based on list names', async () => {
            const lists = await fakeIndex.fetchListNameSuggestions({
                name: 'Go',
                url: 'https://www.ipsum.com/test',
            })
            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(1)
            expect(lists[0].active).toBe(true)
        })

        test('Case insensitive name search', async () => {
            const list = await fakeIndex.fetchListIgnoreCase({
                name: 'somE good things',
            })

            expect(list).toBeDefined()
            expect(list).not.toBeNull()
            expect(list.name).toBe('some good things')
        })

        test('fetch Pages associated with list by url', async () => {
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
            }

            runChecks(
                await fakeIndex.fetchListPagesByUrl({
                    url: 'https://www.ipsum.com/test',
                }),
            )
            const lists = await fakeIndex.fetchListPagesByUrl({
                url: 'https://www.ipsum.com/test',
            })

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(2)
        })
    })
}

describe('Custom List Integrations', runSuite())

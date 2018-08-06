import CustomListBackground from './'
import Storage from '../../search/search-index-new/storage'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'
import * as DATA from './storage.test.data'
import { StorageManager } from '../../search/search-index-new/storage/manager'

const runSuite = () => () => {
    // New storage manager instance
    const storageManager = new StorageManager()
    const fakeIndex = new CustomListBackground({ storageManager })
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

        // Passing fake IndexedDB to the storage manager
        storageManager._finishInitialization(
            new Storage({
                indexedDB,
                IDBKeyRange,
                dbName,
                storageManager,
            }),
        )

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
            const lists = await fakeIndex.fetchListPagesByUrl({
                url: 'https://www.ipsum.com/test',
            })

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(2)
        })

        test('fetch lists with some urls excluded', async () => {
            const lists = await fakeIndex.fetchAllLists({
                excludeIds: [1, 2] as any[],
            })

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(1)
            expect(lists[0].id).not.toBe(1)
            expect(lists[0].id).not.toBe(2)
        })

        test('fetch lists with limits', async () => {
            const lists = await fakeIndex.fetchAllLists({
                limit: 1,
            })

            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            expect(lists.length).toBe(1)
        })
    })

    describe('update ops', () => {
        test('update list name', async () => {
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
            }
            const updatedList = await fakeIndex.updateList({
                id: 3,
                name: 'new name',
            })
            const newName = await fakeIndex.fetchListIgnoreCase({
                name: 'new name',
            })
            runChecks(updatedList)
            runChecks(newName)
            // No of pages and list updated
            expect(updatedList).toBe(1)
            // Test the name is updated correctly
            expect(newName.name).toBe('new name')
        })

        test('fail to update list name', async () => {
            const runChecks = async currPage => {
                expect(currPage).toBeDefined()
                expect(currPage).not.toBeNull()
            }
            const updatedList = await fakeIndex.updateList({
                id: 4,
                name: 'another new name',
            })
            const newName = await fakeIndex.fetchListIgnoreCase({
                name: 'another new name',
            })
            runChecks(updatedList)

            // Nothing updated
            expect(updatedList).toBe(0)
            // cannot found anything with the new name
            expect(newName).toBeUndefined()
        })
    })

    describe('delete ops', () => {
        test('delete list along with associated pages', async () => {
            const lists = await fakeIndex.removeList({ id: 3 })
            expect(lists).toBeDefined()
            expect(lists).not.toBeNull()
            // No of pages and list deleted by
            expect(lists).toEqual({ list: 1, pages: 1 })
        })

        test('Remove page from list', async () => {
            const pages = await fakeIndex.removePageFromList({
                id: 1,
                url: 'https://www.ipsum.com/test',
            })
            expect(pages).toBeDefined()
            expect(pages).not.toBeNull()
            // No of pages deleted
            expect(pages).toBe(1)
        })
    })
}

describe('Custom List Integrations', runSuite())

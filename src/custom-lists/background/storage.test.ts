import StorageManager from '@worldbrain/storex'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import BookmarksBackground from 'src/bookmarks/background'
import initStorageManager from '../../search/memory-storex'
import CustomListBackground from './'
import * as DATA from './storage.test.data'
import { createTestPage } from 'src/search/on-demand-indexing'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { SearchIndex } from 'src/search'

describe('Custom List Integrations', () => {
    let customLists: CustomListBackground
    let searchIndex: SearchIndex
    let storageManager: StorageManager

    const checkDefined = currPage => {
        expect(currPage).toBeDefined()
        expect(currPage).not.toBeNull()
    }

    async function insertTestData() {
        // Insert some test data for all tests to use
        await customLists.createCustomList(DATA.LIST_1)
        await customLists.createCustomList(DATA.LIST_2)
        await customLists.createCustomList(DATA.LIST_3)

        await customLists.insertPageToList(DATA.PAGE_ENTRY_1)
        await customLists.insertPageToList(DATA.PAGE_ENTRY_2)
        await customLists.insertPageToList(DATA.PAGE_ENTRY_3)
        await customLists.insertPageToList(DATA.PAGE_ENTRY_4)
    }

    beforeEach(async () => {
        const {
            backgroundModules,
            ...setup
        } = await setupBackgroundIntegrationTest()
        customLists = backgroundModules.customLists
        searchIndex = backgroundModules.search.searchIndex
        storageManager = setup.storageManager

        // NOTE: Each test starts creating lists at ID `1`
        let fakeListCount = 0
        customLists.generateListId = () => ++fakeListCount

        registerModuleMapCollections(storageManager.registry, {
            customList: customLists.storage,
            bookmarks: backgroundModules.bookmarks.storage,
        })

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('create ops', () => {
        test('should be able to create list entry for existing page', async () => {
            const newPage = await searchIndex.createTestPage({
                url: 'http://www.test.com',
            })
            await newPage.save()

            await customLists.insertPageToList({ id: 1, url: newPage.url })
            const lists = await customLists.fetchListPagesByUrl({
                url: newPage.url,
            })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(newPage.url)
        })

        test('list entry creates for non-existing pages should create page', async () => {
            const url = 'http://www.test.com'

            await customLists.insertPageToList({ id: 1, url })

            const lists = await customLists.fetchListPagesByUrl({ url })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(url)

            const newPage = await customLists['getPage'](url)
            expect(newPage.url).toBe(url.substring(11))
        })
    })

    describe('read ops', () => {
        test('fetch all lists', async () => {
            const lists = await customLists.fetchAllLists({})

            checkDefined(lists)
            expect(lists.length).toBe(3)
        })

        test('fetch pages associated with list', async () => {
            const lists = await customLists.fetchListPagesById({ id: 1 })

            checkDefined(lists)
            expect(lists.length).toBe(2)
        })

        test('fetch suggestions based on list names', async () => {
            const lists = await customLists.fetchListNameSuggestions({
                name: 'Go',
                url: 'https://www.ipsum.com/test',
            })

            checkDefined(lists)

            expect(lists.length).toBe(1)
            expect(lists[0].active).toBe(true)
        })

        test('Case insensitive name search', async () => {
            const list = await customLists.fetchListIgnoreCase({
                name: 'somE good things',
            })

            checkDefined(list)
            expect(list.name).toBe('some good things')
        })

        test('fetch Pages associated with list by url', async () => {
            const lists = await customLists.fetchListPagesByUrl({
                url: 'https://www.ipsum.com/test',
            })

            checkDefined(lists)
            expect(lists.length).toBe(2)
        })

        test('fetch lists with some urls excluded', async () => {
            const lists = await customLists.fetchAllLists({
                excludeIds: [1, 2] as any[],
            })

            checkDefined(lists)
            expect(lists.length).toBe(1)
            expect(lists[0].id).not.toBe(1)
            expect(lists[0].id).not.toBe(2)
        })

        test('fetch lists with limits', async () => {
            const lists = await customLists.fetchAllLists({
                limit: 1,
            })

            checkDefined(lists)
            expect(lists.length).toBe(1)
        })
    })

    describe('update ops', () => {
        test('update list name', async () => {
            const id = 1
            const updatedName = 'new name'

            const before = await customLists.fetchListById({ id })
            expect(before.name).not.toEqual(updatedName)

            await customLists.updateList({
                id,
                name: updatedName,
            })

            const after = await customLists.fetchListById({ id })
            expect(after.name).toEqual(updatedName)
        })

        test('fail to update list name', async () => {
            const updatedList = await customLists.updateList({
                id: 4,
                name: 'another new name',
            })
            const newName = await customLists.fetchListIgnoreCase({
                name: 'another new name',
            })
            // checkDefined(updatedList)

            // Nothing updated
            // expect(updatedList).toBe(0)
            // cannot found anything with the new name
            expect(newName).toBeNull()
        })
    })

    describe('delete ops', () => {
        test('delete list along with associated pages', async () => {
            const lists = await customLists.removeList({ id: 3 })
            checkDefined(lists)

            const list = await customLists.fetchListById({ id: 3 })
            // No of pages and list deleted by
            expect(list).toBeNull()
        })

        test('Remove page from list', async () => {
            const pagesBefore = await customLists.fetchListPagesById({ id: 1 })
            const delResult = await customLists.removePageFromList({
                id: 1,
                url: 'https://www.ipsum.com/test',
            })
            const pagesAfter = await customLists.fetchListPagesById({ id: 1 })
            // No of pages deleted
            expect(pagesBefore.length - pagesAfter.length).toBe(1)
        })
    })
})

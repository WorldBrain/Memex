import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import BookmarksBackground from 'src/bookmarks/background'
import initStorageManager from '../../search/memory-storex'
import CustomListBackground from './'
import { getPage, createTestPage } from 'src/search'
import * as DATA from './storage.test.data'

describe('Custom List Integrations', () => {
    let bg: CustomListBackground

    const checkDefined = currPage => {
        expect(currPage).toBeDefined()
        expect(currPage).not.toBeNull()
    }

    async function insertTestData() {
        // Insert some test data for all tests to use
        await bg.createCustomList(DATA.LIST_1)
        await bg.createCustomList(DATA.LIST_2)
        await bg.createCustomList(DATA.LIST_3)

        await bg.insertPageToList(DATA.PAGE_ENTRY_1)
        await bg.insertPageToList(DATA.PAGE_ENTRY_2)
        await bg.insertPageToList(DATA.PAGE_ENTRY_3)
        await bg.insertPageToList(DATA.PAGE_ENTRY_4)
    }

    beforeEach(async () => {
        const storageManager = initStorageManager()
        const getDb = async () => storageManager
        bg = new CustomListBackground({
            storageManager,
            getPage: getPage(getDb),
            createPage: createTestPage(getDb),
        })
        const bmsBg = new BookmarksBackground({ storageManager })

        // NOTE: Each test starts creating lists at ID `1`
        let fakeListCount = 0
        bg.generateListId = () => ++fakeListCount

        registerModuleMapCollections(storageManager.registry, {
            customList: bg.storage,
            bookmarks: bmsBg.storage,
        })

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('create ops', () => {
        test('should be able to create list entry for existing page', async () => {
            const newPage = await bg['createPage']({
                url: 'http://www.test.com',
            })
            await newPage.save()

            await bg.insertPageToList({ id: 1, url: newPage.url })
            const lists = await bg.fetchListPagesByUrl({ url: newPage.url })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(newPage.url)
        })

        test('list entry creates for non-existing pages should create page', async () => {
            const url = 'http://www.test.com'

            await bg.insertPageToList({ id: 1, url })

            const lists = await bg.fetchListPagesByUrl({ url })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(url)

            const newPage = await bg['getPage'](url)
            expect(newPage.url).toBe(url.substring(11))
        })
    })

    describe('read ops', () => {
        test('fetch all lists', async () => {
            const lists = await bg.fetchAllLists({})

            checkDefined(lists)
            expect(lists.length).toBe(3)
        })

        test('fetch pages associated with list', async () => {
            const lists = await bg.fetchListPagesById({ id: 1 })

            checkDefined(lists)
            expect(lists.length).toBe(2)
        })

        test('fetch suggestions based on list names', async () => {
            const lists = await bg.fetchListNameSuggestions({
                name: 'Go',
                url: 'https://www.ipsum.com/test',
            })

            checkDefined(lists)

            expect(lists.length).toBe(1)
            expect(lists[0].active).toBe(true)
        })

        test('Case insensitive name search', async () => {
            const list = await bg.fetchListIgnoreCase({
                name: 'somE good things',
            })

            checkDefined(list)
            expect(list.name).toBe('some good things')
        })

        test('fetch Pages associated with list by url', async () => {
            const lists = await bg.fetchListPagesByUrl({
                url: 'https://www.ipsum.com/test',
            })

            checkDefined(lists)
            expect(lists.length).toBe(2)
        })

        test('fetch lists with some urls excluded', async () => {
            const lists = await bg.fetchAllLists({
                excludeIds: [1, 2] as any[],
            })

            checkDefined(lists)
            expect(lists.length).toBe(1)
            expect(lists[0].id).not.toBe(1)
            expect(lists[0].id).not.toBe(2)
        })

        test('fetch lists with limits', async () => {
            const lists = await bg.fetchAllLists({
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

            const before = await bg.fetchListById({ id })
            expect(before.name).not.toEqual(updatedName)

            await bg.updateList({
                id,
                name: updatedName,
            })

            const after = await bg.fetchListById({ id })
            expect(after.name).toEqual(updatedName)
        })

        test('fail to update list name', async () => {
            const updatedList = await bg.updateList({
                id: 4,
                name: 'another new name',
            })
            const newName = await bg.fetchListIgnoreCase({
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
            const lists = await bg.removeList({ id: 3 })
            checkDefined(lists)

            const list = await bg.fetchListById({ id: 3 })
            // No of pages and list deleted by
            expect(list).toBeNull()
        })

        test('Remove page from list', async () => {
            const pagesBefore = await bg.fetchListPagesById({ id: 1 })
            const delResult = await bg.removePageFromList({
                id: 1,
                url: 'https://www.ipsum.com/test',
            })
            const pagesAfter = await bg.fetchListPagesById({ id: 1 })
            // No of pages deleted
            expect(pagesBefore.length - pagesAfter.length).toBe(1)
        })
    })
})

import CustomListBackground from './'
import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { SearchIndex } from 'src/search'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { SPECIAL_LISTS } from '@worldbrain/memex-storage/lib/lists/constants'

async function insertTestData({
    customLists,
}: {
    customLists: CustomListBackground
}) {
    // Insert some test data for all tests to use
    await customLists.createCustomList(DATA.LIST_1)
    await customLists.createCustomList(DATA.LIST_2)
    await customLists.createCustomList(DATA.LIST_3)
    // await customLists.createCustomList(DATA.MOBILE_LIST)

    await customLists.insertPageToList(DATA.PAGE_ENTRY_1)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_2)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_3)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_4)
}

async function setupTest() {
    const {
        backgroundModules,
        storageManager,
    } = await setupBackgroundIntegrationTest({
        includePostSyncProcessor: true,
    })
    const customLists: CustomListBackground = backgroundModules.customLists
    const searchIndex: SearchIndex = backgroundModules.search.searchIndex

    // NOTE: Each test starts creating lists at ID `1`
    let fakeListCount = 0
    customLists.generateListId = () => ++fakeListCount

    await insertTestData({ customLists })

    return {
        customLists,
        searchIndex,
        pages: backgroundModules.pages,
        storageManager,
    }
}

describe('Custom List Integrations', () => {
    const checkDefined = (currPage) => {
        expect(currPage).toBeDefined()
        expect(currPage).not.toBeNull()
    }

    describe('create ops', () => {
        test('should be able to create list entry for existing page', async () => {
            const { pages, customLists } = await setupTest()

            const fullUrl = 'http://www.test.com'
            const normalizedUrl = normalizeUrl(fullUrl)
            await pages.indexTestPage({
                fullUrl,
                save: true,
            })

            await customLists.insertPageToList({ id: 1, url: fullUrl })
            const lists = await customLists.fetchListPagesByUrl({
                url: normalizedUrl,
            })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(fullUrl)
        })

        test('list entry creates for non-existing pages should create page', async () => {
            const { searchIndex, customLists } = await setupTest()

            const url = 'http://www.test.com'

            await customLists.insertPageToList({ id: 1, url })

            const lists = await customLists.fetchListPagesByUrl({ url })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(url)

            const newPage = await searchIndex.getPage(url)
            expect(newPage.url).toBe(url.substring(11))
        })

        test('should be able to create inbox list if absent', async () => {
            const { customLists, storageManager } = await setupTest()

            const createdAt = new Date()
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LISTS.INBOX,
                }),
            ).toEqual(null)
            await customLists.createInboxListIfAbsent({ createdAt })
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LISTS.INBOX,
                }),
            ).toEqual(
                expect.objectContaining({
                    name: SPECIAL_LISTS.INBOX,
                    createdAt,
                    isDeletable: false,
                    isNestable: false,
                }),
            )
        })

        test('should not recreate inbox list if already exists', async () => {
            const { customLists } = await setupTest()

            const createdAt = new Date()
            const firstId = await customLists.createInboxListIfAbsent({
                createdAt,
            })
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LISTS.INBOX,
                }),
            ).toEqual(
                expect.objectContaining({
                    name: SPECIAL_LISTS.INBOX,
                    createdAt,
                    isDeletable: false,
                    isNestable: false,
                    id: firstId,
                }),
            )
            const secondId = await customLists.createInboxListIfAbsent({
                createdAt,
            })
            expect(firstId).toEqual(secondId)
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LISTS.INBOX,
                }),
            ).toEqual(
                expect.objectContaining({
                    name: SPECIAL_LISTS.INBOX,
                    createdAt,
                    isDeletable: false,
                    isNestable: false,
                    id: firstId,
                }),
            )
        })
    })

    describe('read ops', () => {
        test('fetch all lists', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                skipMobileList: false,
            })

            checkDefined(lists)
            expect(lists.length).toBe(3)
        })

        test('fetch all lists, skipping mobile list', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                skipMobileList: true,
            })

            checkDefined(lists)
            expect(lists.length).toBe(3)
        })

        test('fetch pages associated with list', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchListPagesById({ id: 1 })

            checkDefined(lists)
            expect(lists.length).toBe(2)
        })

        test('fetch suggestions based on list names', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.__fetchListNameSuggestions({
                name: 'Go',
                url: 'https://www.ipsum.com/test',
            })

            checkDefined(lists)

            expect(lists.length).toBe(1)
            expect(lists[0].active).toBe(true)

            expect(
                await customLists.searchForListSuggestions({ query: 'Go' }),
            ).toEqual([DATA.LIST_2.name])

            expect(
                await customLists.searchForListSuggestions({ query: 'some' }),
            ).toEqual([DATA.LIST_1.name, DATA.LIST_3.name])
        })

        test('Case insensitive name search', async () => {
            const { customLists } = await setupTest()

            const list = await customLists.fetchListIgnoreCase({
                name: 'somE good things',
            })

            checkDefined(list)
            expect(list.name).toBe('some good things')
        })

        test('fetch list associated with page by url', async () => {
            const url = DATA.PAGE_ENTRY_1.url
            const { customLists } = await setupTest()

            const lists = await customLists.fetchListPagesByUrl({ url })

            checkDefined(lists)
            expect(lists.length).toBe(2)

            expect(await customLists.fetchPageLists({ url })).toEqual([
                DATA.LIST_1.name,
                DATA.LIST_2.name,
            ])
        })

        test('fetch lists with some urls excluded', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                excludeIds: [1, 2] as any[],
                skipMobileList: true,
            })

            checkDefined(lists)
            expect(lists.length).toBe(1)
            expect(lists[0].id).not.toBe(1)
            expect(lists[0].id).not.toBe(2)
        })

        test('fetch lists with limits', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                limit: 1,
                skipMobileList: false,
            })

            checkDefined(lists)
            expect(lists.length).toBe(1)
        })
    })

    describe('update ops', () => {
        test('update list name', async () => {
            const { customLists } = await setupTest()

            const id = 1
            const updatedName = 'new name'

            const before = await customLists.fetchListById({ id })
            expect(before.name).not.toEqual(updatedName)

            await customLists.updateList({
                id,
                newName: updatedName,
                oldName: '',
            })

            const after = await customLists.fetchListById({ id })
            expect(after.name).toEqual(updatedName)
        })
    })

    describe('delete ops', () => {
        test('delete list along with associated pages', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.removeList({ id: 3 })
            checkDefined(lists)

            const list = await customLists.fetchListById({ id: 3 })
            // No of pages and list deleted by
            expect(list).toBeNull()
        })

        test('Remove page from list', async () => {
            const { customLists } = await setupTest()

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

describe('Collection Cache', () => {
    async function setupCacheTest() {
        const setup = await setupBackgroundIntegrationTest({
            includePostSyncProcessor: true,
        })
        const listsModule = setup.backgroundModules.customLists
        return { listsModule }
    }

    describe('modifies cache', () => {
        test('add lists', async () => {
            const { listsModule } = await setupCacheTest()

            expect(await listsModule.fetchInitialListSuggestions()).toEqual([])
            await listsModule.createCustomList(DATA.LIST_1)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_1.name,
            ])

            await listsModule.createCustomList(DATA.LIST_2)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_2.name,
                DATA.LIST_1.name,
            ])

            await listsModule.createCustomList(DATA.LIST_3)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_3.name,
                DATA.LIST_2.name,
                DATA.LIST_1.name,
            ])

            await listsModule.createCustomList(DATA.LIST_2)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_2.name,
                DATA.LIST_3.name,
                DATA.LIST_1.name,
            ])
        })

        test("adding new page entry for non-existent list doesn't add dupe cache entries", async () => {
            const { listsModule } = await setupCacheTest()

            expect(await listsModule.fetchInitialListSuggestions()).toEqual([])
            await listsModule.updateListForPage({
                added: DATA.LIST_1.name,
                url: 'https://www.ipsum.com/test',
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_1.name,
            ])

            await listsModule.updateListForPage({
                added: DATA.LIST_1.name,
                url: 'https://www.ipsum.com/test1',
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_1.name,
            ])

            await listsModule.updateListForPage({
                added: DATA.LIST_2.name,
                url: 'https://www.ipsum.com/test',
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                DATA.LIST_2.name,
                DATA.LIST_1.name,
            ])
        })
    })
})

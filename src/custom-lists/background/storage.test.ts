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

async function setupTest({ skipTestData }: { skipTestData?: boolean } = {}) {
    const {
        fetchPageDataProcessor,
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

    if (!skipTestData) {
        await insertTestData({ customLists })
    }

    return {
        ...backgroundModules,
        customLists,
        searchIndex,
        storageManager,
        fetchPageDataProcessor,
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
            expect(lists.length).toBe(2)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(fullUrl)
        })

        test('list entry creates for non-existing pages should create page', async () => {
            const { searchIndex, customLists } = await setupTest()

            const url = 'http://www.test.com'

            await customLists.insertPageToList({ id: 1, url })

            const lists = await customLists.fetchListPagesByUrl({ url })
            expect(lists.length).toBe(2)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(url)

            const newPage = await searchIndex.getPage(url)
            expect(newPage.url).toBe(url.substring(11))
        })

        test('should be able to create inbox list if absent', async () => {
            const { customLists } = await setupTest({ skipTestData: true })

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
                    isDeletable: false,
                    isNestable: false,
                    createdAt,
                }),
            )
        })

        test('should not recreate inbox list if already exists', async () => {
            const { customLists } = await setupTest({ skipTestData: true })

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

        test('should be able to create inbox list entries', async () => {
            const { customLists } = await setupTest({
                skipTestData: true,
            })

            const createdAt = new Date()

            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LISTS.INBOX,
                }),
            ).toEqual(null)

            await customLists.createInboxListEntry({
                fullUrl: DATA.PAGE_ENTRY_1.url,
                createdAt,
            })

            const inboxList = await customLists.fetchListByName({
                name: SPECIAL_LISTS.INBOX,
            })
            expect(inboxList).toEqual(
                expect.objectContaining({
                    name: SPECIAL_LISTS.INBOX,
                    isDeletable: false,
                    isNestable: false,
                    createdAt,
                }),
            )

            expect(
                await customLists.fetchListPagesById({ id: inboxList.id }),
            ).toEqual([
                {
                    pageUrl: normalizeUrl(DATA.PAGE_ENTRY_1.url),
                    fullUrl: DATA.PAGE_ENTRY_1.url,
                    listId: inboxList.id,
                    createdAt,
                },
            ])
        })

        test('should be not able to create inbox list entries for pages once already read', async () => {
            const {
                tags,
                bookmarks,
                customLists,
                directLinking,
                fetchPageDataProcessor,
            } = await setupTest({
                skipTestData: true,
            })
            const url1 = 'https://test.com'
            const url2 = 'https://test.com/sub'
            const url3 = 'https://worldbrain.com/sub'
            const url4 = 'https://internet.com/sub'
            const createdAt = new Date()

            const inboxId = await customLists.createInboxListIfAbsent({
                createdAt,
            })

            let checkInboxEntryCalls = 0
            const checkInboxEntry = async (
                url: string,
                args: { shouldExist: boolean },
            ) => {
                checkInboxEntryCalls++
                const listEntries = await customLists.fetchListPagesById({
                    id: inboxId,
                })
                const entry = listEntries.find((e) => e.fullUrl === url)

                expect({
                    calls: checkInboxEntryCalls,
                    entry,
                }).toEqual({
                    calls: checkInboxEntryCalls,
                    entry: args.shouldExist
                        ? expect.objectContaining({
                              pageUrl: normalizeUrl(url),
                              listId: inboxId,
                              fullUrl: url,
                          })
                        : undefined,
                })
            }
            const setMockFetchPage = (url: string) => {
                fetchPageDataProcessor.mockPage = {
                    fullUrl: url,
                    url: normalizeUrl(url),
                } as any
            }

            // Tag a page - new inbox entry should be created - tag again after deleting entry - no new entry created
            setMockFetchPage(url1)
            await checkInboxEntry(url1, { shouldExist: false })
            await tags.addTagToPage({ url: url1, tag: 'test' })
            await checkInboxEntry(url1, { shouldExist: true })
            await customLists.removePageFromList({
                id: inboxId,
                url: url1,
            })
            await checkInboxEntry(url1, { shouldExist: false })
            await tags.addTagToPage({ url: url1, tag: 'test' })
            await checkInboxEntry(url1, { shouldExist: false })

            // Bookmark a page - new inbox entry should be created - re-bookmark after deleting entry - no new entry created
            setMockFetchPage(url2)
            await checkInboxEntry(url2, { shouldExist: false })
            await bookmarks.addBookmark({ fullUrl: url2 })
            await checkInboxEntry(url2, { shouldExist: true })
            await customLists.removePageFromList({
                id: inboxId,
                url: url2,
            })
            await checkInboxEntry(url2, { shouldExist: false })
            await bookmarks.storage.delBookmark({ url: url2 })
            await bookmarks.addBookmark({ fullUrl: url2 })
            await checkInboxEntry(url2, { shouldExist: false })

            // Annotate a page - new inbox entry should be created - annotate again after deleting entry - no new entry created
            setMockFetchPage(url3)
            await checkInboxEntry(url3, { shouldExist: false })
            await directLinking.createAnnotation(
                { tab: {} },
                { pageUrl: url3, comment: 'test' },
            )
            await checkInboxEntry(url3, { shouldExist: true })
            await customLists.removePageFromList({
                id: inboxId,
                url: url3,
            })
            await checkInboxEntry(url3, { shouldExist: false })
            await directLinking.createAnnotation(
                { tab: {} },
                { pageUrl: url3, comment: 'test' },
            )
            await checkInboxEntry(url3, { shouldExist: false })

            // List a page - new inbox entry should be created - list page again after deleting entry - no new entry created
            setMockFetchPage(url4)
            await checkInboxEntry(url3, { shouldExist: false })
            await checkInboxEntry(url4, { shouldExist: false })
            const testListId = await customLists.createCustomList(DATA.LIST_1)
            await customLists.insertPageToList({ id: testListId, url: url4 })
            await checkInboxEntry(url4, { shouldExist: true })
            await customLists.removePageFromList({
                id: inboxId,
                url: url4,
            })
            await customLists.removePageFromList({ id: testListId, url: url4 })
            await customLists.insertPageToList({ id: testListId, url: url4 })
            await checkInboxEntry(url4, { shouldExist: false })
        })
    })

    describe('read ops', () => {
        test('fetch all lists', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                skipMobileList: false,
            })

            checkDefined(lists)
            expect(lists.length).toBe(4)
        })

        test('fetch all lists, skipping mobile list', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                skipMobileList: true,
            })

            checkDefined(lists)
            expect(lists.length).toBe(4)
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
            expect(lists.length).toBe(2)
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

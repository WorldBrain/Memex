import CustomListBackground from './'
import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { SearchIndex } from 'src/search'
import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

async function insertTestData({
    customLists,
    storageManager,
}: {
    customLists: CustomListBackground
    storageManager: Storex
}) {
    // Insert some test data for all tests to use
    await customLists.createCustomList(DATA.LIST_1)
    await customLists.createCustomList(DATA.LIST_2)
    await customLists.createCustomList(DATA.LIST_3)
    // await customLists.createCustomList(DATA.MOBILE_LIST)

    const lists = storageManager.collection('customLists')
    await lists.updateOneObject(
        { name: DATA.LIST_1.name },
        { nameTerms: DATA.LIST_1_TERMS },
    )
    await lists.updateOneObject(
        { name: DATA.LIST_2.name },
        { nameTerms: DATA.LIST_2_TERMS },
    )
    await lists.updateOneObject(
        { name: DATA.LIST_3.name },
        { nameTerms: DATA.LIST_3_TERMS },
    )

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
        await insertTestData({ customLists, storageManager })
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
            await pages.indexTestPage({ fullUrl })

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
            const { customLists } = await setupTest({ skipTestData: true })

            const createdAt = new Date()
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual(null)
            await customLists.createInboxListIfAbsent({ createdAt })
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual({
                name: SPECIAL_LIST_NAMES.INBOX,
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                nameTerms: [SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase()],
                id: SPECIAL_LIST_IDS.INBOX,
                isDeletable: false,
                isNestable: false,
                createdAt,
            })
        })

        test('should not drop stop words and special characters in searchable list name field', async () => {
            const { customLists, storageManager } = await setupTest({
                skipTestData: true,
            })

            const listNames = [
                'the at or and of test',
                '~!@ #$% ^&* test',
                'funny stuff 😂🤣',
            ]
            await customLists.createCustomLists({ names: listNames })

            expect(
                await storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([
                expect.objectContaining({
                    name: listNames[0],
                    searchableName: listNames[0],
                    nameTerms: listNames[0].split(' '),
                }),
                expect.objectContaining({
                    name: listNames[1],
                    searchableName: listNames[1],
                    nameTerms: listNames[1].split(' '),
                }),
                expect.objectContaining({
                    name: listNames[2],
                    searchableName: listNames[2],
                    nameTerms: listNames[2].split(' '),
                }),
            ])
        })

        test('should not recreate inbox list if already exists', async () => {
            const { customLists } = await setupTest({ skipTestData: true })

            const createdAt = new Date()
            await customLists.createInboxListIfAbsent({ createdAt })
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual(
                expect.objectContaining({
                    name: SPECIAL_LIST_NAMES.INBOX,
                    searchableName: SPECIAL_LIST_NAMES.INBOX,
                    nameTerms: [SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase()],
                    id: SPECIAL_LIST_IDS.INBOX,
                    isDeletable: false,
                    isNestable: false,
                }),
            )
            await customLists.createInboxListIfAbsent({
                createdAt,
            })
            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual({
                name: SPECIAL_LIST_NAMES.INBOX,
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                nameTerms: [SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase()],
                id: SPECIAL_LIST_IDS.INBOX,
                isDeletable: false,
                isNestable: false,
                createdAt,
            })
        })

        test('should be able to create inbox list entries', async () => {
            const { customLists } = await setupTest({
                skipTestData: true,
            })

            const createdAt = new Date()

            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual(null)

            await customLists.createInboxListEntry({
                fullUrl: DATA.PAGE_ENTRY_1.url,
                createdAt,
            })

            expect(
                await customLists.fetchListByName({
                    name: SPECIAL_LIST_NAMES.INBOX,
                }),
            ).toEqual({
                name: SPECIAL_LIST_NAMES.INBOX,
                searchableName: SPECIAL_LIST_NAMES.INBOX,
                nameTerms: [SPECIAL_LIST_NAMES.INBOX.toLocaleLowerCase()],
                id: SPECIAL_LIST_IDS.INBOX,
                isDeletable: false,
                isNestable: false,
                createdAt,
            })

            expect(
                await customLists.fetchListPagesById({
                    id: SPECIAL_LIST_IDS.INBOX,
                }),
            ).toEqual([
                {
                    pageUrl: normalizeUrl(DATA.PAGE_ENTRY_1.url),
                    listId: SPECIAL_LIST_IDS.INBOX,
                    fullUrl: DATA.PAGE_ENTRY_1.url,
                    createdAt,
                },
            ])
            expect(await customLists.getInboxUnreadCount()).toBe(1)
        })

        test('should not be able to create inbox list entries for pages once already read', async () => {
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

            await customLists.createInboxListIfAbsent({ createdAt })

            let checkInboxEntryCalls = 0
            const checkInboxEntry = async (
                url: string,
                args: { shouldExist: boolean },
            ) => {
                checkInboxEntryCalls++
                const listEntries = await customLists.fetchListPagesById({
                    id: SPECIAL_LIST_IDS.INBOX,
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
                              listId: SPECIAL_LIST_IDS.INBOX,
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
                id: SPECIAL_LIST_IDS.INBOX,
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
                id: SPECIAL_LIST_IDS.INBOX,
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
                { pageUrl: url3, comment: 'test', title: 'test' },
            )
            await checkInboxEntry(url3, { shouldExist: true })
            await customLists.removePageFromList({
                id: SPECIAL_LIST_IDS.INBOX,
                url: url3,
            })
            await checkInboxEntry(url3, { shouldExist: false })
            await directLinking.createAnnotation(
                { tab: {} },
                { pageUrl: url3, comment: 'test', title: 'test' },
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
                id: SPECIAL_LIST_IDS.INBOX,
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
            const cutTimestamp = ({ createdAt, ...list }: typeof DATA.LIST_1) =>
                list

            expect(
                await customLists.searchForListSuggestions({ query: 'go' }),
            ).toEqual([
                expect.objectContaining(cutTimestamp(DATA.LIST_2)),
                expect.objectContaining(cutTimestamp(DATA.LIST_3)),
            ])

            expect(
                await customLists.searchForListSuggestions({ query: 'some' }),
            ).toEqual([
                expect.objectContaining(cutTimestamp(DATA.LIST_1)),
                expect.objectContaining(cutTimestamp(DATA.LIST_3)),
            ])

            expect(
                await customLists.searchForListSuggestions({ query: 'ip' }),
            ).toEqual([expect.objectContaining(cutTimestamp(DATA.LIST_1))])

            expect(
                await customLists.searchForListSuggestions({ query: 'ipsum' }),
            ).toEqual([expect.objectContaining(cutTimestamp(DATA.LIST_1))])
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
                DATA.LIST_2.id,
                DATA.LIST_3.id,
            ])
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
    async function setupCacheTest(args: { skipTestData?: boolean }) {
        const setup = await setupBackgroundIntegrationTest({
            includePostSyncProcessor: true,
        })

        if (!args?.skipTestData) {
            await setup.storageManager
                .collection('customLists')
                .createObject(DATA.LIST_1)
            await setup.storageManager
                .collection('customLists')
                .createObject(DATA.LIST_2)
            await setup.storageManager
                .collection('customLists')
                .createObject(DATA.LIST_3)
        }

        const listsModule = setup.backgroundModules.customLists
        return { listsModule }
    }

    describe('modifies cache', () => {
        test('add lists', async () => {
            const { listsModule } = await setupCacheTest({ skipTestData: true })

            expect(await listsModule.fetchInitialListSuggestions()).toEqual([])
            await listsModule.createCustomList(DATA.LIST_1)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                }),
            ])

            await listsModule.createCustomList(DATA.LIST_2)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                }),
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                }),
            ])

            await listsModule.createCustomList(DATA.LIST_3)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                }),
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                }),
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                }),
            ])

            await listsModule.createCustomList(DATA.LIST_2)
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                }),
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                }),
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                }),
            ])
        })

        test('suggestions fetch should work even if cache contains invalid entries', async () => {
            const { listsModule } = await setupCacheTest({ skipTestData: true })

            const nonExistentListId = 355365456
            await listsModule.updateListSuggestionsCache({
                added: nonExistentListId,
            })

            expect(
                await listsModule['localStorage'].get('suggestionIds'),
            ).toEqual([nonExistentListId])
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([])

            await listsModule.createCustomList(DATA.LIST_1)

            expect(
                await listsModule['localStorage'].get('suggestionIds'),
            ).toEqual([DATA.LIST_1.id, nonExistentListId])
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                expect.objectContaining({
                    createdAt: expect.any(Number),
                    localId: expect.any(Number),
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                }),
            ])
        })

        test("adding multiple page entry for same list doesn't add dupe cache entries, though it should re-order by most recently selected", async () => {
            const { listsModule } = await setupCacheTest({})

            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_1.id,
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_2.id,
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_3.id,
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                },
            ])
            await listsModule.updateListForPage({
                added: DATA.LIST_1.id,
                url: 'https://www.ipsum.com/test',
                skipPageIndexing: true,
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_1.id,
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_2.id,
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_3.id,
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                },
            ])

            await listsModule.updateListForPage({
                added: DATA.LIST_2.id,
                url: 'https://www.ipsum.com/test',
                skipPageIndexing: true,
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_2.id,
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_1.id,
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_3.id,
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                },
            ])

            await listsModule.updateListForPage({
                added: DATA.LIST_3.id,
                url: 'https://www.ipsum.com/test1',
                skipPageIndexing: true,
            })
            expect(await listsModule.fetchInitialListSuggestions()).toEqual([
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_3.id,
                    name: DATA.LIST_3.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_2.id,
                    name: DATA.LIST_2.name,
                    focused: false,
                    remoteId: null,
                },
                {
                    createdAt: expect.any(Number),
                    localId: DATA.LIST_1.id,
                    name: DATA.LIST_1.name,
                    focused: false,
                    remoteId: null,
                },
            ])
        })
    })
})

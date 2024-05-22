import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import type { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { buildMaterializedPath } from 'src/content-sharing/utils'

async function insertTestData({
    backgroundModules: { customLists, contentSharing },
    storageManager,
}: Pick<
    BackgroundIntegrationTestSetup,
    'backgroundModules' | 'storageManager'
>) {
    // Insert some test data for all tests to use
    await customLists.createCustomList(DATA.LIST_1)
    await customLists.createCustomList(DATA.LIST_2)
    await customLists.createCustomList(DATA.LIST_3)
    await customLists.createCustomList(DATA.LIST_4)

    await customLists.createListTree(DATA.LIST_TREE_1)
    await customLists.createListTree(DATA.LIST_TREE_2)
    await customLists.createListTree(DATA.LIST_TREE_3)
    await customLists.createListTree(DATA.LIST_TREE_4)
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
    await lists.updateOneObject(
        { name: DATA.LIST_4.name },
        { nameTerms: DATA.LIST_4_TERMS },
    )

    await customLists.insertPageToList(DATA.PAGE_ENTRY_1)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_2)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_3)
    await customLists.insertPageToList(DATA.PAGE_ENTRY_4)
}

async function setupTest({ skipTestData }: { skipTestData?: boolean } = {}) {
    const {
        backgroundModules,
        storageManager,
    } = await setupBackgroundIntegrationTest({
        // includePostSyncProcessor: true,
    })
    const customLists = backgroundModules.customLists

    // NOTE: Each test starts creating lists at ID `1`
    let fakeListCount = 0
    customLists.generateListId = () => ++fakeListCount

    if (!skipTestData) {
        await insertTestData({ backgroundModules, storageManager })
    }

    return {
        ...backgroundModules,
        customLists,
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
            await pages.indexTestPage({ fullUrl })

            await customLists.insertPageToList({ id: 1, url: fullUrl })
            const lists = await customLists.fetchListPagesByUrl({
                url: normalizedUrl,
            })
            expect(lists.length).toBe(1)
            expect(lists[0].pages.length).toBe(1)
            expect(lists[0].pages[0]).toBe(fullUrl)
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

        test('should be able to index space name terms split by forward slash', async () => {
            const { customLists, storageManager } = await setupTest({
                skipTestData: true,
            })

            const listName = 'ok the/at/test list'

            await customLists.createCustomList({
                name: listName,
                id: Date.now(),
            })

            expect(
                await storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([
                expect.objectContaining({
                    name: listName,
                    searchableName: listName,
                    nameTerms: ['ok', 'the', 'at', 'test', 'list'],
                }),
            ])
        })

        test("should be able to edit a space's description", async () => {
            const { customLists, storageManager } = await setupTest({
                skipTestData: true,
            })

            const listName = 'test list'
            const description = 'test list description'

            expect(
                await storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('customListDescriptions')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await customLists.fetchAllLists({
                    skipSpecialLists: true,
                    includeDescriptions: true,
                }),
            ).toEqual([])

            const { localListId } = await customLists.createCustomList({
                name: listName,
                id: Date.now(),
            })
            await customLists.updateListDescription({
                listId: localListId,
                description,
            })

            expect(
                await storageManager
                    .collection('customLists')
                    .findAllObjects({}),
            ).toEqual([
                expect.objectContaining({
                    id: localListId,
                    name: listName,
                }),
            ])
            expect(
                await storageManager
                    .collection('customListDescriptions')
                    .findAllObjects({}),
            ).toEqual([
                {
                    listId: localListId,
                    description,
                },
            ])
            expect(
                await customLists.fetchAllLists({
                    skipSpecialLists: true,
                    includeDescriptions: true,
                }),
            ).toEqual([
                expect.objectContaining({
                    id: localListId,
                    name: listName,
                    description,
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
                // TODO: This data might need to move to fetchPageData return val
                // fetchPageDataProcessor.mockPage = {
                //     fullUrl: url,
                //     url: normalizeUrl(url),
                // } as any
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
            const {
                localListId: testListId,
            } = await customLists.createCustomList(DATA.LIST_1)
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
                skipSpecialLists: false,
            })

            checkDefined(lists)
            expect(lists.length).toBe(5)
        })

        test('fetch all lists, skipping mobile list', async () => {
            const { customLists } = await setupTest()

            const lists = await customLists.fetchAllLists({
                skipSpecialLists: true,
            })

            checkDefined(lists)
            expect(lists.length).toBe(4)
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
                skipSpecialLists: false,
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
        // TODO: Fix this test
        test.skip('delete list along with associated data', async () => {
            return
            const {
                auth,
                customLists,
                contentSharing,
                directLinking,
                storageManager,
            } = await setupTest()
            await auth.authService.loginWithEmailAndPassword(
                TEST_USER.email,
                'password',
            )

            const annotId = 'test.com/#12345678'
            const remoteListId = DATA.LIST_1.remoteListId
            const listDescription = 'test descr'
            await directLinking.createAnnotation(
                { tab: null },
                {
                    url: annotId,
                    pageUrl: 'https://test.com',
                    comment: 'test',
                },
            )
            await customLists.updateListDescription({
                listId: DATA.LIST_1.id,
                description: listDescription,
            })
            await directLinking.annotationStorage.insertAnnotToList({
                listId: DATA.LIST_1.id,
                url: annotId,
            })
            await customLists.insertPageToList({
                url: 'https://test.com',
                id: DATA.LIST_1.id,
            })

            // Create some dummy followedList data assoc. with the list to ensure it deletes
            const followedList = {
                sharedList: remoteListId,
                name: DATA.LIST_1.name,
                creator: TEST_USER.id,
            }
            const followedListEntry = {
                id: 1,
                creator: TEST_USER.id,
                followedList: remoteListId,
                entryTitle: 'test page',
                sharedListEntry: 'test',
                normalizedPageUrl: 'test.com',
                hasAnnotationsFromOthers: false,
                updatedWhen: new Date(),
                createdWhen: new Date(),
            }
            await storageManager
                .collection('followedList')
                .createObject(followedList)
            await storageManager
                .collection('followedListEntry')
                .createObject(followedListEntry)

            expect(
                await storageManager
                    .collection('customLists')
                    .findObject({ id: DATA.LIST_1.id }),
            ).toEqual({
                ...DATA.LIST_1,
                remoteListId: undefined,
                nameTerms: expect.anything(),
                searchableName: DATA.LIST_1.name,
            })
            expect(
                await storageManager
                    .collection('pageListEntries')
                    .findObjects({ listId: DATA.LIST_1.id }),
            ).toEqual([
                {
                    fullUrl: 'https://test.com',
                    pageUrl: 'test.com',
                    listId: DATA.LIST_1.id,
                    createdAt: expect.anything(),
                },
            ])
            expect(
                await storageManager
                    .collection('customListDescriptions')
                    .findAllObjects({}),
            ).toEqual([
                {
                    listId: DATA.LIST_1.id,
                    description: listDescription,
                },
            ])
            expect(
                await storageManager
                    .collection('sharedListMetadata')
                    .findObjects({ localId: DATA.LIST_1.id }),
            ).toEqual([
                {
                    localId: DATA.LIST_1.id,
                    remoteId: remoteListId,
                    private: true,
                },
            ])
            expect(
                await storageManager
                    .collection('customListTrees')
                    .findAllObjects({}),
            ).toEqual([
                {
                    id: expect.anything(),
                    listId: DATA.LIST_1.id,
                    order: expect.any(Number),
                    parentListId: null,
                    path: null,
                    createdWhen: expect.anything(),
                    updatedWhen: expect.anything(),
                },
                {
                    id: expect.anything(),
                    listId: DATA.LIST_2.id,
                    order: expect.any(Number),
                    parentListId: DATA.LIST_1.id,
                    path: buildMaterializedPath(DATA.LIST_1.id),
                    createdWhen: expect.anything(),
                    updatedWhen: expect.anything(),
                },
                {
                    id: expect.anything(),
                    listId: DATA.LIST_3.id,
                    order: expect.any(Number),
                    parentListId: DATA.LIST_1.id,
                    path: buildMaterializedPath(DATA.LIST_1.id),
                    createdWhen: expect.anything(),
                    updatedWhen: expect.anything(),
                },
                {
                    id: expect.anything(),
                    listId: DATA.LIST_4.id,
                    order: expect.any(Number),
                    parentListId: DATA.LIST_2.id,
                    path: buildMaterializedPath(DATA.LIST_1.id, DATA.LIST_2.id),
                    createdWhen: expect.anything(),
                    updatedWhen: expect.anything(),
                },
            ])
            expect(
                await storageManager
                    .collection('annotListEntries')
                    .findAllObjects({}),
            ).toEqual([
                {
                    url: annotId,
                    listId: DATA.LIST_1.id,
                    createdAt: expect.anything(),
                },
            ])
            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([followedList])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([followedListEntry])

            await contentSharing.deleteListAndAllAssociatedData({
                localListId: DATA.LIST_1.id,
            })

            expect(
                await storageManager
                    .collection('customLists')
                    .findObject({ id: DATA.LIST_1.id }),
            ).toEqual(null)
            expect(
                await storageManager
                    .collection('pageListEntries')
                    .findObjects({ id: DATA.LIST_1.id }),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('customListDescriptions')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('sharedListMetadata')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('customListTrees')
                    .findObjects({ listId: DATA.LIST_1.id }),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('annotListEntries')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedList')
                    .findAllObjects({}),
            ).toEqual([])
            expect(
                await storageManager
                    .collection('followedListEntry')
                    .findAllObjects({}),
            ).toEqual([])
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

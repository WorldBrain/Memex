import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest, setPageSearchResult } from '../logic.test.util'
import * as DATA from '../logic.test.data'
import {
    EMPTY_SPACE_NAME_ERR_MSG,
    NON_UNIQ_SPACE_NAME_ERR_MSG,
    BAD_CHAR_SPACE_NAME_ERR_MSG,
} from '@worldbrain/memex-common/lib/utils/space-name-validation'

describe('Dashboard lists sidebar logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to set sidebar locked state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(false)
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(false)
        await searchResults.processEvent('setSidebarLocked', { isLocked: true })
        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(true)
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(false)

        await searchResults.processEvent('setSidebarLocked', {
            isLocked: false,
        })
        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(false)
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(true)
    })

    it('should be able to set sidebar peeking state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(false)
        await searchResults.processEvent('setSidebarPeeking', {
            isPeeking: true,
        })
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(true)

        await searchResults.processEvent('setSidebarPeeking', {
            isPeeking: false,
        })
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(false)
    })

    it('should be able to set sidebar toggle hovered state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(
            searchResults.state.listsSidebar.isSidebarToggleHovered,
        ).toBeFalsy()
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toBeFalsy()

        await searchResults.processEvent('setSidebarToggleHovered', {
            isHovered: true,
        })

        expect(searchResults.state.listsSidebar.isSidebarToggleHovered).toEqual(
            true,
        )
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(true)

        await searchResults.processEvent('setSidebarToggleHovered', {
            isHovered: false,
        })

        expect(searchResults.state.listsSidebar.isSidebarToggleHovered).toEqual(
            false,
        )
        expect(searchResults.state.listsSidebar.isSidebarPeeking).toEqual(false)
    })

    it('should be able to set list query input state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.searchQuery).toEqual('')
        await searchResults.processEvent('setListQueryValue', { query: 'test' })
        expect(searchResults.state.listsSidebar.searchQuery).toEqual('test')

        await searchResults.processEvent('setListQueryValue', {
            query: 'again',
        })
        expect(searchResults.state.listsSidebar.searchQuery).toEqual('again')
    })

    it('should be able to set selected list to filter in search', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(
            undefined,
        )
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('setSelectedListId', { listId: 123 })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(123)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)

        await searchResults.processEvent('setSelectedListId', { listId: 123 })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(
            undefined,
        )
        expect(searchResults.logic['searchTriggeredCount']).toBe(2)

        await searchResults.processEvent('setSelectedListId', { listId: 123 })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(123)
        expect(searchResults.logic['searchTriggeredCount']).toBe(3)

        await searchResults.processEvent('setSelectedListId', { listId: 1 })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(1)
        expect(searchResults.logic['searchTriggeredCount']).toBe(4)
    })

    it('should be able to set dragged-over list', async ({ device }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })

        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setDragOverListId', { listId: 123 })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(123)
        await searchResults.processEvent('setDragOverListId', {
            listId: undefined,
        })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setDragOverListId', { listId: 123 })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(123)
        await searchResults.processEvent('setDragOverListId', { listId: 1 })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(1)
    })

    it("should be able set lists' edit state", async ({ device }) => {
        const { searchResults } = await setupTest(device)

        await device.storageManager.collection('customLists').createObject({
            id: 123,
            name: 'test',
        })
        searchResults.processMutation({
            listsSidebar: {
                listData: {
                    $set: {
                        [123]: {
                            name: 'test',
                            id: 123,
                        },
                    },
                },
            },
        })

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: 123,
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(123)

        expect(searchResults.state.listsSidebar.editingListId).toEqual(123)
        // await searchResults.processEvent('setEditingListId', { listId: 123 })
        // expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(123)
        // expect(searchResults.state.listsSidebar.editingListId).toEqual(123)

        await searchResults.processEvent('cancelListEdit', null)
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
    })

    it('should be able to edit lists', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const name = 'test'
        const nameUpdated = 'test list'

        await searchResults.processEvent('confirmListCreate', { value: name })
        const listId = +Object.keys(
            searchResults.state.listsSidebar.listData,
        )[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(expect.objectContaining({ id: listId, name }))
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name,
            }),
        )

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', { listId })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(listId)

        await searchResults.processEvent('changeListName', {
            value: nameUpdated,
        })
        await searchResults.processEvent('confirmListEdit', {
            value: nameUpdated,
        })

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name: nameUpdated,
            }),
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(expect.objectContaining({ id: listId, name: nameUpdated }))
    })

    it('should block edit and show error on bad list name edits', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)
        const nameA = 'test A'
        const nameB = 'test B'

        await searchResults.processEvent('confirmListCreate', { value: nameA })
        await searchResults.processEvent('confirmListCreate', { value: nameB })
        const listIdA = +Object.keys(
            searchResults.state.listsSidebar.listData,
        )[0]

        expect(searchResults.state.listsSidebar.listData[listIdA]).toEqual(
            expect.objectContaining({
                id: listIdA,
                name: nameA,
            }),
        )

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', {
            listId: listIdA,
        })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(listIdA)
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            null,
        )

        await searchResults.processEvent('changeListName', {
            value: '    ',
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            EMPTY_SPACE_NAME_ERR_MSG,
        )
        expect(searchResults.state.listsSidebar.listData[listIdA]).toEqual(
            expect.objectContaining({
                id: listIdA,
                name: nameA,
            }),
        )

        await searchResults.processEvent('changeListName', {
            value: nameB,
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )
        expect(searchResults.state.listsSidebar.listData[listIdA]).toEqual(
            expect.objectContaining({
                id: listIdA,
                name: nameA,
            }),
        )

        await searchResults.processEvent('changeListName', {
            value: nameA + '[ ( {',
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )
        expect(searchResults.state.listsSidebar.listData[listIdA]).toEqual(
            expect.objectContaining({
                id: listIdA,
                name: nameA,
            }),
        )
    })

    it('should block create and show error on bad list name creates', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            null,
        )

        await searchResults.processEvent('confirmListCreate', { value: 'test' })
        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            null,
        )

        await searchResults.processEvent('confirmListCreate', { value: 'test' })
        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )

        await searchResults.processEvent('confirmListCreate', { value: '    ' })
        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            EMPTY_SPACE_NAME_ERR_MSG,
        )

        await searchResults.processEvent('confirmListCreate', {
            value: 'test [ ( {',
        })
        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )

        await searchResults.processEvent('confirmListCreate', {
            value: 'test 2',
        })
        expect(searchResults.state.listsSidebar.addListErrorMessage).toEqual(
            null,
        )
    })

    it('should be able to cancel list edit', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const name = 'test'

        await searchResults.processEvent('confirmListCreate', { value: name })
        const listId = +Object.keys(
            searchResults.state.listsSidebar.listData,
        )[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(expect.objectContaining({ id: listId, name }))
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name,
            }),
        )

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', { listId })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(listId)

        await searchResults.processEvent('cancelListEdit', null)

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name,
            }),
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(expect.objectContaining({ id: listId, name }))
    })

    it("should be able set lists' show more action btn state", async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: 123,
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(123)
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: 123,
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: 123,
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(123)
        await searchResults.processEvent('setShowMoreMenuListId', { listId: 1 })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(1)
    })

    it('should be able to expand local and followed lists states', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.localLists.isExpanded).toEqual(
            true,
        )
        expect(
            searchResults.state.listsSidebar.followedLists.isExpanded,
        ).toEqual(true)

        await searchResults.processEvent('setLocalListsExpanded', {
            isExpanded: false,
        })
        await searchResults.processEvent('setFollowedListsExpanded', {
            isExpanded: false,
        })

        expect(searchResults.state.listsSidebar.localLists.isExpanded).toEqual(
            false,
        )
        expect(
            searchResults.state.listsSidebar.followedLists.isExpanded,
        ).toEqual(false)

        await searchResults.processEvent('setLocalListsExpanded', {
            isExpanded: true,
        })
        await searchResults.processEvent('setFollowedListsExpanded', {
            isExpanded: true,
        })

        expect(searchResults.state.listsSidebar.localLists.isExpanded).toEqual(
            true,
        )
        expect(
            searchResults.state.listsSidebar.followedLists.isExpanded,
        ).toEqual(true)
    })

    it('should be able to set local lists state', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listIds = DATA.LISTS_1.map((list) => list.id)

        expect(
            Object.values(searchResults.state.listsSidebar.listData),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.localLists).toEqual({
            loadingState: 'pristine',
            isAddInputShown: false,
            isExpanded: true,
            allListIds: [],
            filteredListIds: [],
        })

        await searchResults.processEvent('setLocalLists', {
            lists: DATA.LISTS_1,
        })

        expect(
            Object.values(searchResults.state.listsSidebar.listData),
        ).toEqual(DATA.LISTS_1)
        expect(searchResults.state.listsSidebar.localLists).toEqual({
            loadingState: 'pristine',
            isAddInputShown: false,
            isExpanded: true,
            allListIds: listIds,
            filteredListIds: listIds,
        })
    })

    it('should be able to set followed lists state', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listIds = DATA.LISTS_1.map((list) => list.id)

        expect(
            Object.values(searchResults.state.listsSidebar.listData),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.followedLists).toEqual({
            loadingState: 'pristine',
            isExpanded: true,
            allListIds: [],
            filteredListIds: [],
        })

        await searchResults.processEvent('setFollowedLists', {
            lists: DATA.LISTS_1,
        })

        expect(
            Object.values(searchResults.state.listsSidebar.listData),
        ).toEqual(DATA.LISTS_1)
        expect(searchResults.state.listsSidebar.followedLists).toEqual({
            loadingState: 'pristine',
            isExpanded: true,
            allListIds: listIds,
            filteredListIds: listIds,
        })
    })

    it('should be able to create a new local list', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listName = 'test'

        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.listCreateState).toEqual(
            'pristine',
        )
        expect(searchResults.state.listsSidebar.listData).toEqual({})
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.length,
        ).toEqual(0)

        await searchResults.processEvent('setAddListInputShown', {
            isShown: true,
        })
        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(true)

        const createP = searchResults.processEvent('confirmListCreate', {
            value: listName,
        })
        expect(searchResults.state.listsSidebar.listCreateState).toEqual(
            'running',
        )
        await createP
        expect(searchResults.state.listsSidebar.listCreateState).toEqual(
            'success',
        )
        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(false)

        expect(
            Object.values(searchResults.state.listsSidebar.listData)[0],
        ).toEqual(
            expect.objectContaining({ name: listName, isOwnedList: true }),
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([expect.objectContaining({ name: listName })])
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.length,
        ).toEqual(1)
    })

    it('should be able to cancel a new local list add', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listName = 'test'

        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.listData).toEqual({})
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.length,
        ).toEqual(0)

        await searchResults.processEvent('setAddListInputShown', {
            isShown: true,
        })
        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(true)

        await searchResults.processEvent('cancelListCreate', null)

        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(false)
        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.listData).toEqual({})
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.length,
        ).toEqual(0)
    })

    it('should be able to cancel list deletion', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listName = 'testList'

        await searchResults.processEvent('confirmListCreate', {
            value: listName,
        })

        const listId = +Object.keys(
            searchResults.state.listsSidebar.listData,
        )[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.includes(
                listId,
            ),
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )

        expect(searchResults.state.modals.deletingListId).toEqual(undefined)
        await searchResults.processEvent('setDeletingListId', { listId })
        expect(searchResults.state.modals.deletingListId).toEqual(listId)
        await searchResults.processEvent('cancelListDelete', null)
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.includes(
                listId,
            ),
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )
    })

    it('should be able to confirm list deletion', async ({ device }) => {
        const { searchResults } = await setupTest(device)
        const listName = 'testList'

        await searchResults.processEvent('confirmListCreate', {
            value: listName,
        })

        const listId = +Object.keys(
            searchResults.state.listsSidebar.listData,
        )[0]

        searchResults.processMutation({
            listsSidebar: {
                showMoreMenuListId: { $set: listId },
            },
        })

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.includes(
                listId,
            ),
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            listId,
        )
        expect(searchResults.state.listsSidebar.listDeleteState).toEqual(
            'pristine',
        )
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)

        await searchResults.processEvent('setDeletingListId', { listId })

        expect(
            searchResults.state.listsSidebar.showMoreMenuListId,
        ).toBeUndefined()
        expect(searchResults.state.modals.deletingListId).toEqual(listId)

        const deleteP = searchResults.processEvent('confirmListDelete', null)
        expect(searchResults.state.listsSidebar.listDeleteState).toEqual(
            'running',
        )

        await deleteP

        expect(searchResults.state.listsSidebar.listDeleteState).toEqual(
            'success',
        )
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listId }),
        ).toEqual(null)
        expect(
            searchResults.state.listsSidebar.localLists.filteredListIds.includes(
                listId,
            ),
        ).toEqual(false)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            undefined,
        )
    })

    it('should be able to add a page to a list via drag-and-drop', async ({
        device,
    }) => {
        const page = DATA.PAGE_1
        const listId = 123
        const { searchResults } = await setupTest(device, {
            seedData: async (logic, { storageManager }) => {
                await storageManager.collection('pages').createObject({
                    url: page.normalizedUrl,
                    title: page.fullTitle,
                })

                await storageManager.collection('customLists').createObject({
                    id: listId,
                })
            },

            overrideSearchTrigger: true,
        })

        expect(
            await device.storageManager
                .collection('pageListEntries')
                .findObject({ pageUrl: page.normalizedUrl, listId }),
        ).toEqual(null)

        searchResults.processMutation({
            listsSidebar: {
                dragOverListId: { $set: listId },
                listData: {
                    [listId]: {
                        $set: {
                            id: listId,
                            name: 'testList',
                        },
                    },
                },
            },
            searchResults: {
                pageData: {
                    byId: {
                        $set: {
                            [page.normalizedUrl]: {
                                lists: [],
                            },
                        },
                    },
                },
            },
        })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(listId)
        expect(
            searchResults.state.searchResults.pageData.byId[page.normalizedUrl]
                .lists,
        ).toEqual([])

        const dataTransfer = new DataTransfer()
        dataTransfer.setData(
            'text/plain',
            JSON.stringify({
                fullPageUrl: page.fullUrl,
                normalizedPageUrl: page.normalizedUrl,
            }),
        )
        await searchResults.processEvent('dropPageOnListItem', {
            listId,
            dataTransfer,
        })

        expect(
            searchResults.state.listsSidebar.listData[listId]?.wasPageDropped,
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        expect(
            searchResults.state.searchResults.pageData.byId[page.normalizedUrl]
                .lists,
        ).toEqual([listId])

        expect(
            await device.storageManager
                .collection('pageListEntries')
                .findObject({ pageUrl: page.normalizedUrl, listId }),
        ).toEqual(
            expect.objectContaining({
                pageUrl: page.normalizedUrl,
                fullUrl: page.fullUrl,
                listId,
            }),
        )
    })

    it('should be able to share a list, setting its remoteId state', async ({
        device,
    }) => {
        device.backgroundModules.contentSharing.remoteFunctions.shareList = async () =>
            ({ remoteListId: DATA.LISTS_1[1].remoteId } as any)

        for (const listData of DATA.LISTS_1) {
            await device.storageManager.collection('customLists').createObject({
                id: listData.id,
                name: listData.name,
            })
        }

        const listId = DATA.LISTS_1[1].id
        const { searchResults } = await setupTest(device, {
            seedData: setPageSearchResult(DATA.PAGE_SEARCH_RESULT_3),
            runInitLogic: true,
        })

        expect(
            searchResults.state.listsSidebar.listData[listId].remoteId,
        ).toBeUndefined()

        await searchResults.processEvent('shareList', {
            listId,
        })

        expect(searchResults.state.listsSidebar.listData[listId].remoteId).toBe(
            DATA.LISTS_1[1].remoteId,
        )
    })
})

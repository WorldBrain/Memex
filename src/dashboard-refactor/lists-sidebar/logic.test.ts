import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest, setPageSearchResult } from '../logic.test.util'
import * as DATA from '../logic.test.data'
import { getListShareUrl } from 'src/content-sharing/utils'

describe('Dashboard search results logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to set sidebar locked state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(false)
        await searchResults.processEvent('setSidebarLocked', { isLocked: true })
        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(true)

        await searchResults.processEvent('setSidebarLocked', {
            isLocked: false,
        })
        expect(searchResults.state.listsSidebar.isSidebarLocked).toEqual(false)
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
        await searchResults.processEvent('setSidebarToggleHovered', {
            isHovered: true,
        })
        expect(searchResults.state.listsSidebar.isSidebarToggleHovered).toEqual(
            true,
        )

        await searchResults.processEvent('setSidebarToggleHovered', {
            isHovered: false,
        })
        expect(searchResults.state.listsSidebar.isSidebarToggleHovered).toEqual(
            false,
        )
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

    it('should be able to selected lists to filter in search', async ({
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

    it("should be able set lists' edit state", async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: 123,
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(123)

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', { listId: 123 })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        expect(searchResults.state.listsSidebar.editingListId).toEqual(123)
        await searchResults.processEvent('setEditingListId', { listId: 123 })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', { listId: 123 })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(123)
        await searchResults.processEvent('setEditingListId', { listId: 1 })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(1)
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
            isExpanded: false,
            listIds: [],
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
            isExpanded: false,
            listIds,
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
            isExpanded: false,
            listIds: [],
        })

        await searchResults.processEvent('setFollowedLists', {
            lists: DATA.LISTS_1,
        })

        expect(
            Object.values(searchResults.state.listsSidebar.listData),
        ).toEqual(DATA.LISTS_1)
        expect(searchResults.state.listsSidebar.followedLists).toEqual({
            loadingState: 'pristine',
            isExpanded: false,
            listIds,
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
            searchResults.state.listsSidebar.localLists.listIds.length,
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
        ).toEqual(expect.objectContaining({ name: listName }))
        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([expect.objectContaining({ name: listName })])
        expect(
            searchResults.state.listsSidebar.localLists.listIds.length,
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
            searchResults.state.listsSidebar.localLists.listIds.length,
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
            searchResults.state.listsSidebar.localLists.listIds.length,
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
            searchResults.state.listsSidebar.localLists.listIds.includes(
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
            searchResults.state.listsSidebar.localLists.listIds.includes(
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
            searchResults.state.listsSidebar.localLists.listIds.includes(
                listId,
            ),
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            expect.objectContaining({
                id: listId,
                name: listName,
            }),
        )

        expect(searchResults.state.listsSidebar.listDeleteState).toEqual(
            'pristine',
        )
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)
        await searchResults.processEvent('setDeletingListId', { listId })
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
            searchResults.state.listsSidebar.localLists.listIds.includes(
                listId,
            ),
        ).toEqual(false)
        expect(searchResults.state.listsSidebar.listData[listId]).toEqual(
            undefined,
        )
    })

    it('should be able to share list', async ({ device }) => {
        const listId = 123
        const remoteListId = 'test'
        device.backgroundModules.contentSharing.remoteFunctions.shareListEntries = async () => {}
        device.backgroundModules.contentSharing.remoteFunctions.shareList = async () => ({
            remoteListId,
        })

        const { searchResults } = await setupTest(device)
        searchResults.processMutation({
            listsSidebar: {
                listData: {
                    [listId]: {
                        $set: {
                            id: listId,
                            listCreationState: 'pristine',
                            name: 'test',
                        },
                    },
                },
            },
        })

        expect(
            searchResults.state.listsSidebar.listData[listId].listCreationState,
        ).toEqual('pristine')
        expect(
            searchResults.state.listsSidebar.listData[listId].shareUrl,
        ).toBeUndefined()

        await searchResults.processEvent('setShareListId', { listId })
        const shareP = searchResults.processEvent('shareList', null)

        expect(
            searchResults.state.listsSidebar.listData[listId].listCreationState,
        ).toEqual('running')
        await shareP

        expect(
            searchResults.state.listsSidebar.listData[listId].listCreationState,
        ).toEqual('success')
        expect(
            searchResults.state.listsSidebar.listData[listId].shareUrl,
        ).toEqual(getListShareUrl({ remoteListId }))
    })
})

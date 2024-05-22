import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest, setPageSearchResult } from '../logic.test.util'
import * as DATA from '../logic.test.data'
import {
    EMPTY_SPACE_NAME_ERR_MSG,
    NON_UNIQ_SPACE_NAME_ERR_MSG,
    BAD_CHAR_SPACE_NAME_ERR_MSG,
} from '@worldbrain/memex-common/lib/utils/space-name-validation'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'

describe('Dashboard lists sidebar logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    // TODO: Fix this test
    it('should be able to set sidebar locked state', async ({ device }) => {
        return
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

    // TODO: Fix this test

    it('should be able to set sidebar peeking state', async ({ device }) => {
        return
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

    // TODO: Fix this test

    it('should be able to set sidebar toggle hovered state', async ({
        device,
    }) => {
        return
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
        return
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
        return
        const { searchResults, annotationsCache } = await setupTest(device, {
            overrideSearchTrigger: true,
            runInitLogic: true,
        })
        await searchResults.processEvent('confirmListCreate', { value: 'test' })
        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(null)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)

        await searchResults.processEvent('setSelectedListId', {
            listId: listData.unifiedId,
        })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(
            listData.unifiedId,
        )
        expect(searchResults.logic['searchTriggeredCount']).toBe(2)

        await searchResults.processEvent('setSelectedListId', {
            listId: listData.unifiedId,
        })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(null)
        expect(searchResults.logic['searchTriggeredCount']).toBe(3)

        await searchResults.processEvent('setSelectedListId', {
            listId: listData.unifiedId,
        })

        expect(searchResults.state.listsSidebar.selectedListId).toEqual(
            listData.unifiedId,
        )
        expect(searchResults.logic['searchTriggeredCount']).toBe(4)
    })

    it('should be able to set dragged-over list', async ({ device }) => {
        return
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })

        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setDragOverListId', { listId: '123' })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual('123')
        await searchResults.processEvent('setDragOverListId', {
            listId: undefined,
        })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setDragOverListId', { listId: '123' })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual('123')
        await searchResults.processEvent('setDragOverListId', { listId: '1' })
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual('1')
    })

    it("should be able set lists' edit state", async ({ device }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: '123',
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            '123',
        )

        expect(searchResults.state.listsSidebar.editingListId).toEqual('123')
        await searchResults.processEvent('setEditingListId', { listId: '123' })
        // expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual('123')
        // expect(searchResults.state.listsSidebar.editingListId).toEqual('123')

        await searchResults.processEvent('cancelListEdit', null)
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
    })

    it('should be able to edit lists', async ({ device }) => {
        return
        const { searchResults, annotationsCache } = await setupTest(device, {
            runInitLogic: true,
        })
        const name = 'test'
        const nameUpdated = 'test list'

        await searchResults.processEvent('confirmListCreate', { value: name })
        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(expect.objectContaining({ id: listData.localId, name }))

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', {
            listId: listData.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            listData.unifiedId,
        )

        await searchResults.processEvent('confirmListEdit', {
            value: nameUpdated,
            listId: listData.unifiedId,
        })

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            expect.objectContaining({
                unifiedId: listData.unifiedId,
                name: nameUpdated,
            }),
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(
            expect.objectContaining({
                id: listData.localId,
                name: nameUpdated,
            }),
        )
    })

    it('should block edit and show error on bad list name edits', async ({
        device,
    }) => {
        return
        const { searchResults, annotationsCache } = await setupTest(device, {
            runInitLogic: true,
        })
        const nameA = 'test A'
        const nameB = 'test B'

        await searchResults.processEvent('confirmListCreate', { value: nameA })
        await searchResults.processEvent('confirmListCreate', { value: nameB })
        const listDataA = normalizedStateToArray(annotationsCache.lists).find(
            (list) => list.name === nameA,
        )

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', {
            listId: listDataA.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            listDataA.unifiedId,
        )
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            null,
        )

        await searchResults.processEvent('confirmListEdit', {
            value: '    ',
            listId: listDataA.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            EMPTY_SPACE_NAME_ERR_MSG,
        )
        expect(annotationsCache.lists.byId[listDataA.unifiedId]).toEqual(
            expect.objectContaining({
                unifiedId: listDataA.unifiedId,
                name: nameA,
            }),
        )

        await searchResults.processEvent('confirmListEdit', {
            value: nameB,
            listId: listDataA.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )
        expect(annotationsCache.lists.byId[listDataA.unifiedId]).toEqual(
            expect.objectContaining({
                unifiedId: listDataA.unifiedId,
                name: nameA,
            }),
        )

        await searchResults.processEvent('confirmListEdit', {
            value: nameA + '[ ( {',
            listId: listDataA.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )
        expect(annotationsCache.lists.byId[listDataA.unifiedId]).toEqual(
            expect.objectContaining({
                unifiedId: listDataA.unifiedId,
                name: nameA,
            }),
        )
    })

    it('should block create and show error on bad list name creates', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device, {
            runInitLogic: true,
        })

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
        return
        const { searchResults, annotationsCache } = await setupTest(device)
        const name = 'test'

        await searchResults.processEvent('confirmListCreate', { value: name })
        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(expect.objectContaining({ id: listData.localId, name }))

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setEditingListId', {
            listId: listData.unifiedId,
        })
        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            listData.unifiedId,
        )

        await searchResults.processEvent('cancelListEdit', null)

        expect(searchResults.state.listsSidebar.editingListId).toEqual(
            undefined,
        )
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            listData,
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(expect.objectContaining({ id: listData.localId, name }))
    })

    it("should be able set lists' show more action btn state", async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: '123',
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            '123',
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: '123',
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            undefined,
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: '123',
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual(
            '123',
        )
        await searchResults.processEvent('setShowMoreMenuListId', {
            listId: '1',
        })
        expect(searchResults.state.listsSidebar.showMoreMenuListId).toEqual('1')
    })

    it('should be able to expand local, followed, and joined lists states', async ({
        device,
    }) => {
        return
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.areLocalListsExpanded).toEqual(
            true,
        )
        expect(
            searchResults.state.listsSidebar.areFollowedListsExpanded,
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.areJoinedListsExpanded).toEqual(
            true,
        )

        await searchResults.processEvent('setLocalListsExpanded', {
            isExpanded: false,
        })
        await searchResults.processEvent('setFollowedListsExpanded', {
            isExpanded: false,
        })
        await searchResults.processEvent('setJoinedListsExpanded', {
            isExpanded: false,
        })

        expect(searchResults.state.listsSidebar.areLocalListsExpanded).toEqual(
            false,
        )
        expect(
            searchResults.state.listsSidebar.areFollowedListsExpanded,
        ).toEqual(false)
        expect(searchResults.state.listsSidebar.areJoinedListsExpanded).toEqual(
            false,
        )

        await searchResults.processEvent('setLocalListsExpanded', {
            isExpanded: true,
        })
        await searchResults.processEvent('setFollowedListsExpanded', {
            isExpanded: true,
        })
        await searchResults.processEvent('setJoinedListsExpanded', {
            isExpanded: true,
        })

        expect(searchResults.state.listsSidebar.areLocalListsExpanded).toEqual(
            true,
        )
        expect(
            searchResults.state.listsSidebar.areFollowedListsExpanded,
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.areJoinedListsExpanded).toEqual(
            true,
        )
    })

    it('should be able to cancel a new local list add', async ({ device }) => {
        return
        const { searchResults } = await setupTest(device)
        const listName = 'test'

        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.lists.byId).toEqual({})
        expect(searchResults.state.listsSidebar.filteredListIds.length).toEqual(
            0,
        )

        await searchResults.processEvent('setAddListInputShown', {
            isShown: true,
        })
        expect(searchResults.state.listsSidebar.isAddListInputShown).toEqual(
            true,
        )

        await searchResults.processEvent('cancelListCreate', null)

        expect(searchResults.state.listsSidebar.isAddListInputShown).toEqual(
            false,
        )
        expect(
            await device.storageManager
                .collection('customLists')
                .findAllObjects({}),
        ).toEqual([])
        expect(searchResults.state.listsSidebar.lists.byId).toEqual({})
        expect(searchResults.state.listsSidebar.filteredListIds.length).toEqual(
            0,
        )
    })

    it('should be able to cancel list deletion', async ({ device }) => {
        return
        const { searchResults, annotationsCache } = await setupTest(device)
        const listName = 'testList'

        await searchResults.processEvent('confirmListCreate', {
            value: listName,
        })

        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(
            expect.objectContaining({
                id: listData.localId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.filteredListIds.includes(
                listData.unifiedId,
            ),
        ).toEqual(true)
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            listData,
        )

        expect(searchResults.state.modals.deletingListId).toEqual(undefined)
        await searchResults.processEvent('setDeletingListId', {
            listId: listData.unifiedId,
        })
        expect(searchResults.state.modals.deletingListId).toEqual(
            listData.unifiedId,
        )
        await searchResults.processEvent('cancelListDelete', null)
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(
            expect.objectContaining({
                id: listData.localId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.filteredListIds.includes(
                listData.unifiedId,
            ),
        ).toEqual(true)
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            listData,
        )
    })

    it('should be able to confirm list deletion', async ({ device }) => {
        return
        const { searchResults, annotationsCache } = await setupTest(device, {
            runInitLogic: true,
        })
        const listName = 'testList'

        await searchResults.processEvent('confirmListCreate', {
            value: listName,
        })

        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        searchResults.processMutation({
            listsSidebar: {
                showMoreMenuListId: { $set: listData.unifiedId },
            },
        })

        expect(
            await device.storageManager
                .collection('customLists')
                .findOneObject({ id: listData.localId }),
        ).toEqual(
            expect.objectContaining({
                id: listData.localId,
                name: listName,
            }),
        )
        expect(
            searchResults.state.listsSidebar.filteredListIds.includes(
                listData.unifiedId,
            ),
        ).toEqual(true)
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            listData,
        )

        expect(searchResults.state.listsSidebar.listDeleteState).toEqual(
            'pristine',
        )
        expect(searchResults.state.modals.deletingListId).toEqual(undefined)
        await searchResults.processEvent('setDeletingListId', {
            listId: listData.unifiedId,
        })
        expect(searchResults.state.modals.deletingListId).toEqual(
            listData.unifiedId,
        )

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
                .findOneObject({ id: listData.localId }),
        ).toEqual(null)
        expect(
            searchResults.state.listsSidebar.filteredListIds.includes(
                listData.unifiedId,
            ),
        ).toEqual(false)
        expect(annotationsCache.lists.byId[listData.unifiedId]).toEqual(
            undefined,
        )
    })

    it('should be able to add a page to a list via drag-and-drop', async ({
        device,
    }) => {
        return
        const page = DATA.PAGE_1
        const localListId = 123
        const { searchResults, annotationsCache } = await setupTest(device, {
            seedData: async (logic, { storageManager }) => {
                await storageManager.collection('pages').createObject({
                    url: page.normalizedUrl,
                    title: page.fullTitle,
                })

                await storageManager.collection('customLists').createObject({
                    name: 'test',
                    id: localListId,
                })
            },
            overrideSearchTrigger: true,
            runInitLogic: true,
        })
        const listData = normalizedStateToArray(annotationsCache.lists)[0]

        expect(
            await device.storageManager
                .collection('pageListEntries')
                .findObject({
                    pageUrl: page.normalizedUrl,
                    listId: localListId,
                }),
        ).toEqual(null)

        searchResults.processMutation({
            listsSidebar: {
                dragOverListId: { $set: listData.unifiedId },
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

        expect(
            searchResults.state.listsSidebar.lists.byId[listData.unifiedId]
                .wasPageDropped,
        ).not.toEqual(true)
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            listData.unifiedId,
        )
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
        const dropEventP = searchResults.processEvent('dropOnListItem', {
            listId: listData.unifiedId,
            dataTransfer,
        })

        expect(
            searchResults.state.listsSidebar.lists.byId[listData.unifiedId]
                .wasPageDropped,
        ).toEqual(true)
        expect(searchResults.state.listsSidebar.dragOverListId).toEqual(
            undefined,
        )
        expect(
            searchResults.state.searchResults.pageData.byId[page.normalizedUrl]
                .lists,
        ).toEqual([listData.unifiedId])

        // After a timeout, the "wasPageDropped" state should be reset
        await dropEventP
        expect(
            searchResults.state.listsSidebar.lists.byId[listData.unifiedId]
                .wasPageDropped,
        ).toEqual(false)

        expect(
            await device.storageManager
                .collection('pageListEntries')
                .findObject({
                    pageUrl: page.normalizedUrl,
                    listId: listData.localId,
                }),
        ).toEqual(
            expect.objectContaining({
                pageUrl: page.normalizedUrl,
                fullUrl: page.fullUrl,
                listId: listData.localId,
            }),
        )
    })
})

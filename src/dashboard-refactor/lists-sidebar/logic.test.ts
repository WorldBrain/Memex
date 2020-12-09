import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from '../logic.test.util'
import * as DATA from '../logic.test.data'

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

    it('should be able to set list query input state', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.listsSidebar.searchQuery).toEqual('')
        await searchResults.processEvent('setListQueryValue', { value: 'test' })
        expect(searchResults.state.listsSidebar.searchQuery).toEqual('test')

        await searchResults.processEvent('setListQueryValue', {
            value: 'again',
        })
        expect(searchResults.state.listsSidebar.searchQuery).toEqual('again')
    })

    it('should be able to mutate add local list input states', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(
            searchResults.state.listsSidebar.localLists.addInputValue,
        ).toEqual('')
        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(false)

        await searchResults.processEvent('setAddListInputShown', {
            isShown: true,
        })
        await searchResults.processEvent('setAddListInputValue', {
            value: 'hi',
        })

        expect(
            searchResults.state.listsSidebar.localLists.addInputValue,
        ).toEqual('hi')
        expect(
            searchResults.state.listsSidebar.localLists.isAddInputShown,
        ).toEqual(true)
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
            addInputValue: '',
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
            addInputValue: '',
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
})

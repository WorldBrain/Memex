import ListPickerLogic, { ListPickerState } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import 'jest-extended'

// see https://github.com/WorldBrain/Memex-Mobile/blob/develop/app/src/features/overview/ui/screens/dashboard/logic.test.ts
// see https://github.com/WorldBrain/Memex-Mobile/blob/7b74b83d3f3ebec793317c84222939d3fcba67b7/app/src/ui/index.tests.ts#L3

const TESTURL = 'http://test.com'

const stateHelper = ({
    listResultListSelected,
    listResultListNotSelected,
    listResultListFocused,
    selectedLists,
    query,
    newListButton,
}: {
    listResultListSelected?: string[]
    listResultListNotSelected?: string[]
    listResultListFocused?: string[]
    selectedLists?: string[]
    query?: string
    newListButton?: boolean
}) => ({
    displayLists: [
        ...(listResultListFocused ?? []).map((t) => ({
            name: t,
            focused: true,
            selected: false,
        })),
        ...(listResultListNotSelected ?? [])
            .filter((t) => !(listResultListFocused ?? []).includes(t))
            .map((t) => ({
                name: t,
                focused: false,
                selected: false,
            })),
        ...(listResultListSelected ?? [])
            .filter((t) => !(listResultListFocused ?? []).includes(t))
            .map((t) => ({
                name: t,
                focused: false,
                selected: true,
            })),
    ],
    selectedLists: selectedLists ?? [],
    loadingQueryResults: false,
    loadingSuggestions: false,
    query: query ?? '',
    newListName: newListButton ? query : '',
})

const setupLogicHelper = async ({
    device,
    onUpdateListSelection,
    queryLists,
    queryListResults,
    initialSuggestions,
    initialSelectedLists,
    url,
}: {
    device: UILogicTestDevice
    onUpdateListSelection?: (
        _: string[],
        added: string,
        deleted: string,
    ) => Promise<void>
    queryLists?: (query: string) => Promise<string[]>
    queryListResults?: string[]
    initialSuggestions?: string[]
    initialSelectedLists?: string[]
    url?: string
}) => {
    const backendListUpdate = async (
        _: string[],
        added: string,
        deleted: string,
    ) =>
        device.backgroundModules.customLists.updateListForPage({
            added,
            deleted,
            url: url ?? TESTURL,
        })

    const listPickerLogic = new ListPickerLogic({
        onUpdateListSelection: onUpdateListSelection ?? backendListUpdate,
        queryLists:
            queryLists ?? queryListResults
                ? async (query: string) => queryListResults
                : async (query: string) => [],
        loadDefaultSuggestions: () => initialSuggestions ?? [],
        initialSelectedLists: async () => initialSelectedLists ?? [],
        listAllTabs: async (tab) => null,
    })

    const testLogic = device.createElement(listPickerLogic)
    await testLogic.init()
    return { testLogic, listPickerLogic }
}

const expectStateToEqual = (
    resultState: ListPickerState,
    expectedState: ListPickerState,
) => {
    const { displayLists: queryListsResult, ...restResult } = resultState
    const { displayLists: queryListsExpected, ...restExpected } = expectedState
    expect(restResult).toEqual(restExpected)
    // Compares the array state without caring about order
    expect(queryListsResult).toIncludeSameMembers(queryListsExpected)
}

describe('ListPickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should correctly load initial lists', async ({ device }) => {
        const initialSuggestions = ['sugg1', 'sugg2']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
        })

        expect(testLogic.state).toEqual(
            stateHelper({ listResultListNotSelected: initialSuggestions }),
        )
    })

    it('should correctly load initial lists and set those selected when selected are in initial lists', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2', 'test1']
        const initialSelectedLists = ['test1']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
        })

        expectStateToEqual(
            testLogic.state,
            stateHelper({
                listResultListNotSelected: ['sugg1', 'sugg2'],
                listResultListSelected: initialSelectedLists,
                selectedLists: initialSelectedLists,
            }),
        )
    })
    it('should correctly load initial lists and set those selected when selected are not in initial lists', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['test1']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
        })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListNotSelected: ['sugg1', 'sugg2'],
                selectedLists: initialSelectedLists,
            }),
        )
    })

    it('should correctly search for a list when list is already selected', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['test1']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
            queryListResults: ['test1'],
        })
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListSelected: ['test1'],
                selectedLists: initialSelectedLists,
                query: 'test',
                newListButton: true,
            }),
        )
    })

    it('should correctly search for a list when list is not selected', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['something']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
            queryListResults: ['test1'],
        })
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListNotSelected: ['test1'],
                selectedLists: initialSelectedLists,
                query: 'test',
                newListButton: true,
            }),
        )
    })

    it('should correctly navigate the search results by up and down arrows', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['something']
        const queryListResults = ['test1', 'test2', 'test3', 'test4']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
            queryListResults,
        })
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListNotSelected: queryListResults,
                selectedLists: initialSelectedLists,
                query: 'test',
                newListButton: true,
            }),
        )

        const expectStateToEqualWithFocus = (focusedList) =>
            expectStateToEqual(
                testLogic.state,
                stateHelper({
                    listResultListNotSelected: queryListResults,
                    selectedLists: initialSelectedLists,
                    listResultListFocused: focusedList ? [focusedList] : [],
                    query: 'test',
                    newListButton: true,
                }),
            )

        const keyPressAndExpectFocus = async (sequence) => {
            for (const seq of sequence) {
                await testLogic.processEvent('keyPress', { key: seq[0] })
                expectStateToEqualWithFocus(seq[1])
            }
        }

        await keyPressAndExpectFocus([
            ['ArrowDown', 'test1'],
            ['ArrowDown', 'test2'],
            ['ArrowDown', 'test3'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowDown', 'test4'],
            ['ArrowUp', 'test3'],
            ['ArrowUp', 'test2'],
            ['ArrowUp', 'test1'],
            // This is navigating beyond the initial result, which is the 'New List: ... ' button, so no list will be selected
            ['ArrowUp'],
            ['ArrowUp'],
            ['ArrowUp'],
            ['ArrowDown', 'test1'],
        ])
    })

    it('should correctly remove search', async ({ device }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['something']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
            queryListResults: ['test1'],
        })
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListNotSelected: ['test1'],
                selectedLists: initialSelectedLists,
                query: 'test',
                newListButton: true,
            }),
        )

        await testLogic.processEvent('searchInputChanged', { query: '' })

        expect(testLogic.state).toEqual(
            stateHelper({
                listResultListNotSelected: initialSuggestions,
                selectedLists: initialSelectedLists,
                query: '',
                newListButton: false,
            }),
        )
    })

    it('should show default lists after selecting a list', async ({ device }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const initialSelectedLists = ['something']

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedLists,
            queryListResults: ['test1'],
        })
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        // expect(element.state).toEqual(
        //     stateHelper({
        //         selectedLists: ['test1'],
        //         query: 'test',
        //         newListButton: true,
        //     }),
        // )
        //
        // await element.processEvent('searchInputChanged', { query: '' })
        //
        // expect(element.state).toEqual(
        //     stateHelper({
        //         listResultListNotSelected: [],
        //         selectedLists: [],
        //         query: '',
        //         newListButton: false,
        //     }),
        // )
    })

    it('should correctly add list ', async ({ device }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const { testLogic, listPickerLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
        })

        const listsBefore = await device.backgroundModules.customLists.fetchPageLists({
            url: TESTURL,
        })
        await testLogic.processEvent('resultListPress', {
            list: { name: 'sugg1', focused: false, selected: false },
        })
        await listPickerLogic.processingUpstreamOperation

        const listsAfter = await device.backgroundModules.customLists.fetchPageLists({
            url: TESTURL,
        })

        expect(listsBefore).toEqual([])
        expect(listsAfter).toEqual(['sugg1'])
    })

    it('should be in the right state after an error adding a list', async ({
        device,
    }) => {
        const initialSuggestions = ['sugg1', 'sugg2']
        const testError = Error('test error')
        const onUpdateListSelection = async () => {
            throw testError
        }
        const { testLogic, listPickerLogic } = await setupLogicHelper({
            onUpdateListSelection,
            device,
            initialSuggestions,
        })

        const listsBefore = await device.backgroundModules.customLists.fetchPageLists({
            url: TESTURL,
        })

        await expect(
            testLogic.processEvent('resultListPress', {
                list: { name: 'sugg1', focused: false, selected: false },
            }),
        ).rejects.toEqual(testError)

        const listsAfter = await device.backgroundModules.customLists.fetchPageLists({
            url: TESTURL,
        })

        expect(listsBefore).toEqual([])
        expect(listsAfter).toEqual([])
    })
})

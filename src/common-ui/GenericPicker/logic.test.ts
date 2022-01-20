import GenericPickerLogic, { GenericPickerState } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import 'jest-extended'
import { PickerUpdateHandler, KeyEvent } from './types'
import * as DATA from './logic.test.data'
import type { ListDisplayEntry } from 'src/custom-lists/ui/CollectionPicker/logic'

class TestPickerLogic extends GenericPickerLogic<ListDisplayEntry> {
    pickerName = 'Test'

    validateEntry = this._validateEntry
}

const TESTURL = 'http://test.com'

const stateHelper = ({
    entryResultEntrySelected,
    entryResultEntryNotSelected,
    entryResultEntryFocused,
    selectedEntries,
    query,
    newEntryButton,
}: {
    entryResultEntrySelected?: string[]
    entryResultEntryNotSelected?: string[]
    entryResultEntryFocused?: string[]
    selectedEntries?: string[]
    query?: string
    newEntryButton?: boolean
}) => ({
    displayEntries: [
        ...(entryResultEntryFocused ?? []).map((t) => ({
            name: t,
            focused: true,
            selected: false,
        })),
        ...(entryResultEntryNotSelected ?? [])
            .filter((t) => !(entryResultEntryFocused ?? []).includes(t))
            .map((t) => ({
                name: t,
                focused: false,
                selected: false,
            })),
        ...(entryResultEntrySelected ?? [])
            .filter((t) => !(entryResultEntryFocused ?? []).includes(t))
            .map((t) => ({
                name: t,
                focused: false,
                selected: true,
            })),
    ],
    selectedEntries: selectedEntries ?? [],
    loadingQueryResults: false,
    loadingSuggestions: false,
    query: query ?? '',
    newEntryName: newEntryButton ? query : '',
})

async function insertTestData({ storageManager }: UILogicTestDevice) {
    for (const list of DATA.TEST_LISTS) {
        await storageManager.collection('customLists').createObject(list)
    }
    for (const metadata of DATA.TEST_LIST_METADATA) {
        await storageManager
            .collection('sharedListMetadata')
            .createObject(metadata)
    }
}

const setupLogicHelper = async ({
    device,
    queryEntries,
    initialSuggestions,
    initialSelectedEntries,
    skipTestData,
    url,
    ...args
}: {
    device: UILogicTestDevice
    queryEntries?: (query: string) => Promise<ListDisplayEntry[]>
    createNewEntry?: (name: string) => Promise<string | number>
    selectEntry?: (id: string | number) => Promise<void>
    unselectEntry?: (id: string | number) => Promise<void>
    initialSuggestions?: ListDisplayEntry[]
    initialSelectedEntries?: number[]
    skipTestData?: boolean
    url?: string
}) => {
    if (!skipTestData) {
        await insertTestData(device)
    }

    let generatedIds = 100

    const entryPickerLogic = new TestPickerLogic({
        queryEntries: queryEntries ?? (async () => []),
        createNewEntry: args.createNewEntry ?? (async (name) => generatedIds++),
        selectEntry: args.selectEntry ?? (async (id) => {}),
        unselectEntry: args.unselectEntry ?? (async (id) => {}),
        loadDefaultSuggestions: () => initialSuggestions ?? [],
        initialSelectedEntries: async () => initialSelectedEntries ?? [],
        actOnAllTabs: async (entry) => null,
        getEntryDisplayField: ({ name }) => name,
        getEntryIdField: ({ localId }) => localId,
    })

    const testLogic = device.createElement(entryPickerLogic)
    return { testLogic, entryPickerLogic }
}

const expectStateToEqual = (
    resultState: GenericPickerState,
    expectedState: GenericPickerState,
) => {
    const { displayEntries: queryEntriesResult, ...restResult } = resultState
    const {
        displayEntries: queryEntriesExpected,
        ...restExpected
    } = expectedState
    expect(restResult).toEqual(restExpected)
    // Compares the array state without caring about order
    expect(queryEntriesResult).toIncludeSameMembers(queryEntriesExpected)
}

const formDisplayEntryState = (args: {
    testDataIndex: number
    isShared?: boolean
    flags?: { selected: boolean; focused: boolean }
}) => ({
    name: DATA.TEST_LISTS[args.testDataIndex].name,
    localId: DATA.TEST_LISTS[args.testDataIndex].id,
    createdAt: DATA.TEST_LISTS[args.testDataIndex].createdAt.getTime(),
    remoteId: args.isShared
        ? DATA.TEST_LIST_METADATA[args.testDataIndex].remoteId
        : null,
    ...(args.flags ?? { selected: false, focused: false }),
})

describe('GenericPickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        includePostSyncProcessor: true,
    })

    it('should correctly load initial entries', async ({ device }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 2),
        )

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
        })

        expect(testLogic.state.displayEntries).toEqual([])
        expect(testLogic.state.selectedEntries).toEqual([])

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual(initialSuggestions)
        expect(testLogic.state.selectedEntries).toEqual([])
    })

    it('should correctly load initial entries and set as selected those that are in initial entries', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        const initialSelectedEntries = [
            DATA.TEST_LISTS[0].id,
            DATA.TEST_LISTS[2].id,
        ]

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedEntries,
        })

        expect(testLogic.state.displayEntries).toEqual([])
        expect(testLogic.state.selectedEntries).toEqual([])

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual(initialSuggestions)
        expect(testLogic.state.selectedEntries).toEqual(initialSelectedEntries)
    })

    it('should correctly search for a entry when entry is already selected', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 4),
        )
        const initialSelectedEntries = [DATA.TEST_LISTS[0].id]
        const queryResult = DATA.derivePickerEntries([DATA.TEST_LISTS[0]])

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            initialSelectedEntries,
            queryEntries: async () => queryResult,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                displayEntries: queryResult,
                selectedEntries: initialSelectedEntries,
            }),
        )
    })

    it('should correctly search for a entry when entry is not selected', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 4),
        )
        const queryResult = DATA.derivePickerEntries([DATA.TEST_LISTS[0]])

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            queryEntries: async () => queryResult,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                displayEntries: queryResult,
                selectedEntries: [],
            }),
        )
    })

    it('should correctly search for a entry regardless of case', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 4),
        )
        const searchResult = DATA.derivePickerEntries([DATA.TEST_LISTS[0]])
        let lastQuery: string

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            queryEntries: async (query: string) => {
                lastQuery = query
                return searchResult
            },
        })
        expect(lastQuery).toEqual(undefined)

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'Test' })

        expect(lastQuery).toEqual('test')

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'Test',
                newEntryName: 'Test',
                displayEntries: searchResult,
            }),
        )
    })

    it('should correctly navigate the search results by up and down arrows', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(DATA.TEST_LISTS)

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            queryEntries: async (query: string) => initialSuggestions,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                newEntryName: 'test',
                displayEntries: initialSuggestions,
            }),
        )

        const expectStateToEqualWithFocus = (focusedEntryId: number) =>
            expect(testLogic.state).toEqual(
                expect.objectContaining({
                    displayEntries: initialSuggestions.map((entry) =>
                        entry.localId === focusedEntryId
                            ? { ...entry, focused: true }
                            : entry,
                    ),
                }),
            )

        const keyPresses: [KeyEvent, number][] = [
            ['ArrowDown', DATA.TEST_LISTS[0].id],
            ['ArrowDown', DATA.TEST_LISTS[1].id],
            ['ArrowDown', DATA.TEST_LISTS[2].id],
            ['ArrowDown', DATA.TEST_LISTS[3].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowUp', DATA.TEST_LISTS[3].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowUp', DATA.TEST_LISTS[3].id],
            ['ArrowUp', DATA.TEST_LISTS[2].id],
            ['ArrowUp', DATA.TEST_LISTS[1].id],
            ['ArrowUp', DATA.TEST_LISTS[0].id],
            // This is navigating beyond the initial result, which is the 'New Entry: ... ' button, so no entry will be selected
            ['ArrowUp', -1],
            ['ArrowUp', -1],
            ['ArrowDown', DATA.TEST_LISTS[0].id],
        ]

        for (const [key, focusedEntryId] of keyPresses) {
            await testLogic.processEvent('keyPress', { key })
            expectStateToEqualWithFocus(focusedEntryId)
        }
    })

    it('should correctly clear search input', async ({ device }) => {
        const initialSuggestions = DATA.derivePickerEntries(DATA.TEST_LISTS)

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            queryEntries: async (query: string) => initialSuggestions,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                newEntryName: 'test',
            }),
        )

        await testLogic.processEvent('searchInputChanged', { query: '' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
            }),
        )
    })

    // it('should show default entries again after selecting any entry', async ({
    //     device,
    // }) => {
    //     const initialSuggestions = DATA.derivePickerEntries(DATA.TEST_LISTS.slice(0, 3))

    //     const { testLogic } = await setupLogicHelper({
    //         device,
    //         initialSuggestions,
    //         queryEntries: async (query: string) => initialSuggestions,
    //     })

    //     await testLogic.init()
    //     await testLogic.processEvent('searchInputChanged', { query: 'test' })

    //     expect(element.state).toEqual(
    //         stateHelper({
    //             selectedEntries: ['test1'],
    //             query: 'test',
    //             newEntryButton: true,
    //         }),
    //     )

    //     await element.processEvent('searchInputChanged', { query: '' })

    //     expect(element.state).toEqual(
    //         stateHelper({
    //             entryResultEntryNotSelected: [],
    //             selectedEntries: [],
    //             query: '',
    //             newEntryButton: false,
    //         }),
    //     )
    // })

    it('should correctly validate new entries', async ({ device }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        expect(() => entryPickerLogic.validateEntry('test')).not.toThrowError()
        expect(() =>
            entryPickerLogic.validateEntry('test test'),
        ).not.toThrowError()
        expect(() =>
            entryPickerLogic.validateEntry('test test $test %'),
        ).not.toThrowError()
        expect(() =>
            entryPickerLogic.validateEntry('test test $test %🤣😁 😅😁'),
        ).not.toThrowError()
        expect(() => entryPickerLogic.validateEntry('   ')).toThrowError(
            `Test Picker Validation: Can't add entry with only whitespace`,
        )
    })

    // it('should correctly add entry ', async ({ device }) => {
    //     const initialSuggestions = DATA.derivePickerEntries(DATA.TEST_LISTS.slice(0, 3))
    //     const { testLogic, entryPickerLogic } = await setupLogicHelper({
    //         device,
    //         initialSuggestions,
    //     })

    //     await testLogic.init()

    //     const entriesBefore = await device.backgroundModules.customLists.fetchAllLists({ limit: 1000 })

    //     await testLogic.processEvent('resultEntryPress', {
    //         entry: DATA.derivePickerEntries([DATA.TEST_LISTS[0]])[0],
    //     })

    //     await entryPickerLogic.processingUpstreamOperation

    //     const entriesAfter = await device.backgroundModules.customLists.fetchAllLists({ limit: 1000 })

    //     expect(entriesBefore).toEqual([])
    //     expect(entriesAfter).toEqual(['sugg1'])
    // })

    it('should correctly add existing entry to all tabs', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
        })

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])

        await testLogic.processEvent('resultEntryAllPress', {
            entry: initialSuggestions[0],
        })
        await entryPickerLogic.processingUpstreamOperation

        expect(testLogic.state.selectedEntries).toEqual([
            initialSuggestions[0].localId,
        ])
    })

    // it('should correctly add a new entry to all tabs', async ({ device }) => {
    //     const { testLogic, entryPickerLogic } = await setupLogicHelper({
    //         device,
    //     })

    //     const { customLists } = device.backgroundModules

    //     expect(testLogic.state.selectedEntries).toEqual([])

    //     await testLogic.processEvent('newEntryAllPress', {
    //         entry: 'sugg1',
    //     })
    //     await entryPickerLogic.processingUpstreamOperation

    //     expect(await customLists.fetchPageLists({ url: TESTURL })).toEqual([
    //         'sugg1',
    //     ])
    // })

    // it('should be in the right state after an error adding a entry', async ({
    //     device,
    // }) => {
    //     const initialSuggestions = ['sugg1', 'sugg2']
    //     const testError = Error('test error')
    //     const onUpdateEntrySelection = async () => {
    //         throw testError
    //     }
    //     const { testLogic, entryPickerLogic } = await setupLogicHelper({
    //         onUpdateEntrySelection,
    //         device,
    //         initialSuggestions,
    //     })

    //     const entriesBefore = await device.backgroundModules.customLists.fetchPageLists(
    //         {
    //             url: TESTURL,
    //         },
    //     )

    //     await expect(
    //         testLogic.processEvent('resultEntryPress', {
    //             entry: { name: 'sugg1', focused: false, selected: false },
    //         }),
    //     ).rejects.toEqual(testError)

    //     const entriesAfter = await device.backgroundModules.customLists.fetchPageLists(
    //         {
    //             url: TESTURL,
    //         },
    //     )

    //     expect(entriesBefore).toEqual([])
    //     expect(entriesAfter).toEqual([])
    // })
})

import GenericPickerLogic, { GenericPickerState } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import 'jest-extended'
import * as DATA from './logic.test.data'
import type { KeyEvent } from './types'
import type { ListDisplayEntry } from 'src/custom-lists/ui/CollectionPicker/logic'

class TestPickerLogic extends GenericPickerLogic<ListDisplayEntry> {
    pickerName = 'Test'

    validateEntry = this._validateEntry
}

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

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                displayEntries: [],
                selectedEntries: [],
            }),
        )

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                displayEntries: initialSuggestions,
                selectedEntries: initialSelectedEntries,
            }),
        )
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

    it('should show default entries again after clearing the search query', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )

        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
        })
        const newEntryText = 'testwerwerwerwer'

        const expectDefaultState = () =>
            expect(testLogic.state).toEqual(
                expect.objectContaining({
                    query: '',
                    newEntryName: '',
                    selectedEntries: [],
                    displayEntries: initialSuggestions,
                }),
            )

        await testLogic.init()

        expectDefaultState()

        await testLogic.processEvent('searchInputChanged', {
            query: newEntryText,
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: newEntryText,
                newEntryName: newEntryText,
                selectedEntries: [],
                displayEntries: [],
            }),
        )

        await testLogic.processEvent('searchInputChanged', {
            query: '',
        })
        expectDefaultState()
    })

    it('should correctly select existing entry for all tabs', async ({
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

    it('should correctly select/unselect existing entry', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        let selectedEntryId = null
        let unselectedEntryId = null
        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            unselectEntry: async (entryId) => {
                unselectedEntryId = entryId
            },
            selectEntry: async (entryId) => {
                selectedEntryId = entryId
            },
        })

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(selectedEntryId).toBe(null)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: initialSuggestions[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([
            initialSuggestions[0].localId,
        ])
        expect(selectedEntryId).toBe(initialSuggestions[0].localId)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: initialSuggestions[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(selectedEntryId).toBe(initialSuggestions[0].localId)
        expect(unselectedEntryId).toBe(initialSuggestions[0].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: initialSuggestions[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([
            initialSuggestions[0].localId,
        ])
        expect(selectedEntryId).toBe(initialSuggestions[0].localId)
        expect(unselectedEntryId).toBe(initialSuggestions[0].localId)
    })

    it('should correctly unselect selected entries shown in the search input bar', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        let unselectedEntryId = null
        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            unselectEntry: async (entryId) => {
                unselectedEntryId = entryId
            },
        })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
                displayEntries: initialSuggestions,
            }),
        )
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: initialSuggestions[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [initialSuggestions[0].localId],
                displayEntries: initialSuggestions,
            }),
        )
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('selectedEntryPress', {
            entry: initialSuggestions[0].name,
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
                displayEntries: initialSuggestions,
            }),
        )
        expect(unselectedEntryId).toBe(initialSuggestions[0].localId)
    })

    it('should show default entries again + new entry after selecting a new entry', async ({
        device,
    }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        const newEntryId = 1000
        const newEntryText = 'test'

        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            createNewEntry: async (entryName) => {
                newEntryName = entryName
                return newEntryId
            },
        })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
                displayEntries: initialSuggestions,
            }),
        )

        await testLogic.processEvent('searchInputChanged', {
            query: newEntryText,
        })

        expect(newEntryName).toBe(null)
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: newEntryText,
                newEntryName: newEntryText,
            }),
        )

        await testLogic.processEvent('newEntryPress', { entry: newEntryText })

        expect(newEntryName).toBe(newEntryText)
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [newEntryId],
                displayEntries: [
                    ...initialSuggestions,
                    expect.objectContaining({
                        name: newEntryText,
                        localId: newEntryId,
                        focused: false,
                    }),
                ],
            }),
        )
    })

    it('should correctly add a new entry to all tabs', async ({ device }) => {
        const initialSuggestions = DATA.derivePickerEntries(
            DATA.TEST_LISTS.slice(0, 3),
        )
        const newEntryId = 1000
        const newEntryText = 'test'

        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
            initialSuggestions,
            createNewEntry: async (entryName) => {
                newEntryName = entryName
                return newEntryId
            },
        })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
                displayEntries: initialSuggestions,
            }),
        )

        await testLogic.processEvent('searchInputChanged', {
            query: newEntryText,
        })

        expect(newEntryName).toBe(null)
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: newEntryText,
                newEntryName: newEntryText,
            }),
        )

        await testLogic.processEvent('newEntryAllPress', {
            entry: newEntryText,
        })
        expect(newEntryName).toBe(newEntryText)

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [newEntryId],
                displayEntries: [
                    ...initialSuggestions,
                    expect.objectContaining({
                        name: newEntryText,
                        localId: newEntryId,
                        focused: false,
                    }),
                ],
            }),
        )
    })
})

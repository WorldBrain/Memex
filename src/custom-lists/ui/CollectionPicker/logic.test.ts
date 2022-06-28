import 'jest-extended'
import SpacePickerLogic, { SpaceDisplayEntry } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import delay from 'src/util/delay'
import {
    EMPTY_SPACE_NAME_ERR_MSG,
    NON_UNIQ_SPACE_NAME_ERR_MSG,
    BAD_CHAR_SPACE_NAME_ERR_MSG,
} from '@worldbrain/memex-common/lib/utils/space-name-validation'

async function insertTestData({
    storageManager,
    backgroundModules,
}: UILogicTestDevice) {
    for (const list of [...DATA.TEST_LISTS].reverse()) {
        await backgroundModules.customLists.createCustomList({
            createdAt: list.createdAt,
            name: list.name,
            id: list.id,
        })
    }

    // Ensure not all the test lists are in the initial suggestions, for testing diversity
    const suggestions = await backgroundModules.customLists['localStorage'].get(
        'suggestionIds',
    )
    await backgroundModules.customLists['localStorage'].set(
        'suggestionIds',
        suggestions.slice(0, 5),
    )

    for (const metadata of DATA.TEST_LIST_METADATA) {
        await storageManager
            .collection('sharedListMetadata')
            .createObject(metadata)
    }
}

const setupLogicHelper = async ({
    device,
    initialSelectedEntries,
    skipTestData,
    url,
    onSubmit = () => undefined,
    ...args
}: {
    device: UILogicTestDevice
    createNewEntry?: (name: string) => Promise<number>
    selectEntry?: (id: string | number) => Promise<void>
    unselectEntry?: (id: string | number) => Promise<void>
    queryEntries?: (query: string) => Promise<SpaceDisplayEntry[]>
    onSubmit?: () => void

    initialSelectedEntries?: number[]
    skipTestData?: boolean
    url?: string
}) => {
    if (!skipTestData) {
        await insertTestData(device)
    }

    let generatedIds = 100

    const entryPickerLogic = new SpacePickerLogic({
        createNewEntry: args.createNewEntry ?? (async (name) => generatedIds++),
        selectEntry: args.selectEntry ?? (async (id) => {}),
        unselectEntry: args.unselectEntry ?? (async (id) => {}),
        initialSelectedEntries: async () => initialSelectedEntries ?? [],
        actOnAllTabs: async (entry) => null,
        contentSharingBG:
            device.backgroundModules.contentSharing.remoteFunctions,
        spacesBG: device.backgroundModules.customLists.remoteFunctions,
        onSubmit,
    })

    const testLogic = device.createElement(entryPickerLogic)
    return { testLogic, entryPickerLogic }
}

describe('SpacePickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should correctly load initial entries', async ({ device }) => {
        const { testLogic } = await setupLogicHelper({
            device,
        })

        expect(testLogic.state.displayEntries).toEqual([])
        expect(testLogic.state.selectedEntries).toEqual([])

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual(
            DATA.TEST_LIST_SUGGESTIONS,
        )
        expect(testLogic.state.selectedEntries).toEqual([])
    })

    it('should correctly load initial entries and set as selected those that are in initial entries', async ({
        device,
    }) => {
        const initialSelectedEntries = [
            DATA.TEST_LISTS[0].id,
            DATA.TEST_LISTS[2].id,
        ]

        const { testLogic } = await setupLogicHelper({
            device,
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
                displayEntries: [
                    DATA.TEST_LIST_SUGGESTIONS[0],
                    DATA.TEST_LIST_SUGGESTIONS[2],
                    DATA.TEST_LIST_SUGGESTIONS[1],
                    DATA.TEST_LIST_SUGGESTIONS[3],
                    DATA.TEST_LIST_SUGGESTIONS[4],
                ],
                selectedEntries: initialSelectedEntries,
            }),
        )
    })

    it('should correctly search for a entry when entry is already selected', async ({
        device,
    }) => {
        const initialSelectedEntries = [DATA.TEST_LISTS[0].id]

        const { testLogic } = await setupLogicHelper({
            device,
            initialSelectedEntries,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', { query: 'test' })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                displayEntries: [DATA.TEST_LIST_SUGGESTIONS[0]],
                selectedEntries: initialSelectedEntries,
            }),
        )
    })

    it('should correctly search for a entry when entry is not selected', async ({
        device,
    }) => {
        const queryResult = DATA.derivePickerEntries([DATA.TEST_LISTS[0]])

        const { testLogic } = await setupLogicHelper({
            device,
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
        const { testLogic } = await setupLogicHelper({
            device,
        })
        await testLogic.init()
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )

        await testLogic.processEvent('searchInputChanged', { query: 'Test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'Test',
                newEntryName: 'Test',
                displayEntries: DATA.TEST_LIST_SUGGESTIONS.slice(0, 1),
            }),
        )

        await testLogic.processEvent('searchInputChanged', { query: '' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )

        await delay(150) // This exists to get passed the 150ms debounce on search input changes

        await testLogic.processEvent('searchInputChanged', { query: 'test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                newEntryName: 'test',
                displayEntries: DATA.TEST_LIST_SUGGESTIONS.slice(0, 1),
            }),
        )
    })

    it('should correctly navigate the search results by up and down arrows', async ({
        device,
    }) => {
        const { testLogic } = await setupLogicHelper({ device })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )

        const expectStateToEqualWithFocus = (focusedEntryId: number) =>
            expect(testLogic.state).toEqual(
                expect.objectContaining({
                    displayEntries: DATA.TEST_LIST_SUGGESTIONS.map((entry) =>
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
            await testLogic.processEvent('keyPress', {
                event: { key } as KeyboardEvent,
            })
            expectStateToEqualWithFocus(focusedEntryId)
        }
    })

    it('should trigger props.onSubmit upon ctrl/cmd+Enter press', async ({
        device,
    }) => {
        let wasSubmitted = false
        const { testLogic } = await setupLogicHelper({
            device,
            onSubmit: () => (wasSubmitted = true),
        })

        await testLogic.init()

        expect(wasSubmitted).toBe(false)
        await testLogic.processEvent('keyPress', {
            event: { key: 'Enter' } as KeyboardEvent,
        })
        expect(wasSubmitted).toBe(false)
        await testLogic.processEvent('keyPress', {
            event: { key: 'Enter', metaKey: true } as KeyboardEvent,
        })
        expect(wasSubmitted).toBe(true)
    })

    it('should correctly validate new entries', async ({ device }) => {
        const { entryPickerLogic, testLogic } = await setupLogicHelper({
            device,
        })
        await testLogic.init()

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
            'Space Picker Validation: ' + EMPTY_SPACE_NAME_ERR_MSG,
        )
        expect(() => entryPickerLogic.validateEntry(' test []  ')).toThrowError(
            'Space Picker Validation: ' + BAD_CHAR_SPACE_NAME_ERR_MSG,
        )
        expect(() =>
            entryPickerLogic.validateEntry(DATA.TEST_LIST_SUGGESTIONS[0].name),
        ).toThrowError(
            'Space Picker Validation: ' + NON_UNIQ_SPACE_NAME_ERR_MSG,
        )
    })

    it('should show default entries again after clearing the search query', async ({
        device,
    }) => {
        const { testLogic } = await setupLogicHelper({
            device,
        })
        const newEntryText = 'testwerwerwerwer'

        const expectDefaultState = () =>
            expect(testLogic.state).toEqual(
                expect.objectContaining({
                    query: '',
                    newEntryName: '',
                    selectedEntries: [],
                    displayEntries: DATA.TEST_LIST_SUGGESTIONS,
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

    it('should be able to toggle context menu for given entry', async ({
        device,
    }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(testLogic.state.contextMenuListId).toEqual(null)
        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(null)

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_LIST_SUGGESTIONS[0].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        )
    })

    it('should be able to rename list for given entry, and validate new names', async ({
        device,
    }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })
        const newNameA = 'new list name'
        const newNameB = 'another new list name'

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(null)

        // Attempt to re-use another list name - should set error
        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
            name: DATA.TEST_LIST_SUGGESTIONS[0].name,
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )

        // Attempt to use a list name with invalid characters - also should set error
        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
            name: DATA.TEST_LIST_SUGGESTIONS[1].name + '[ ( {',
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )

        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
            name: newNameA,
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(null)

        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[3].localId,
            name: newNameB,
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_LIST_SUGGESTIONS[2],
            { ...DATA.TEST_LIST_SUGGESTIONS[3], name: newNameB },
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_LIST_SUGGESTIONS[2],
            { ...DATA.TEST_LIST_SUGGESTIONS[3], name: newNameB },
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(null)
    })

    it('should be delete list for given entry', async ({ device }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])

        await testLogic.processEvent('deleteList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])

        await testLogic.processEvent('deleteList', {
            listId: DATA.TEST_LIST_SUGGESTIONS[3].localId,
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
    })

    it('should correctly select existing entry for all tabs', async ({
        device,
    }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])

        await testLogic.processEvent('resultEntryAllPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })
        await entryPickerLogic.processingUpstreamOperation

        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        ])
    })

    it('should correctly select/unselect existing entry', async ({
        device,
    }) => {
        let selectedEntryId: string | number = null
        let unselectedEntryId: string | number = null
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
            unselectEntry: async (entryId) => {
                unselectedEntryId = entryId
            },
            selectEntry: async (entryId) => {
                selectedEntryId = entryId
            },
        })

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(selectedEntryId).toBe(null)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[1],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[1],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[3],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
            DATA.TEST_LIST_SUGGESTIONS[3].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[3].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
    })

    it('should correctly select/unselect existing entry', async ({
        device,
    }) => {
        let selectedEntryId: string | number = null
        let unselectedEntryId: string | number = null
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
            unselectEntry: async (entryId) => {
                unselectedEntryId = entryId
            },
            selectEntry: async (entryId) => {
                selectedEntryId = entryId
            },
        })

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(selectedEntryId).toBe(null)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[1],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[1],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[3],
        })

        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
            DATA.TEST_LIST_SUGGESTIONS[3].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[3].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[1].localId)
    })

    it('should correctly add to the default entries array upon selection of list outside of initial suggestions', async ({
        device,
    }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        const expectedEntry = {
            createdAt: DATA.TEST_LISTS[5].createdAt.getTime(),
            localId: DATA.TEST_LISTS[5].id,
            name: DATA.TEST_LISTS[5].name,
            focused: false,
            remoteId: null,
        }

        await testLogic.init()

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(testLogic.state.displayEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])

        await testLogic.processEvent('searchInputChanged', {
            query: 'suggestions',
        })

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(testLogic.state.displayEntries).toEqual([expectedEntry])
        expect(entryPickerLogic.defaultEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])

        await testLogic.processEvent('resultEntryPress', {
            entry: expectedEntry,
        })

        expect(testLogic.state.displayEntries).toEqual([
            expectedEntry,
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(entryPickerLogic.defaultEntries).toEqual([
            expectedEntry,
            DATA.TEST_LIST_SUGGESTIONS[0],
            DATA.TEST_LIST_SUGGESTIONS[1],
            DATA.TEST_LIST_SUGGESTIONS[2],
            DATA.TEST_LIST_SUGGESTIONS[3],
            DATA.TEST_LIST_SUGGESTIONS[4],
        ])
        expect(testLogic.state.selectedEntries).toEqual([expectedEntry.localId])
    })

    it('should correctly unselect selected entries shown in the search input bar', async ({
        device,
    }) => {
        let unselectedEntryId = null
        const { testLogic } = await setupLogicHelper({
            device,
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
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [DATA.TEST_LIST_SUGGESTIONS[0].localId],
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('selectedEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0].localId,
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
            }),
        )
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
    })

    it('should clear query upon entry selection', async ({ device }) => {
        const { testLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        await testLogic.processEvent('searchInputChanged', { query: 'test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                selectedEntries: [],
            }),
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                selectedEntries: [DATA.TEST_LIST_SUGGESTIONS[0].localId],
            }),
        )
        await testLogic.processEvent('searchInputChanged', { query: 'test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                selectedEntries: [DATA.TEST_LIST_SUGGESTIONS[0].localId],
            }),
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                selectedEntries: [],
            }),
        )
    })

    it('should show default entries again + new entry after selecting a new entry', async ({
        device,
    }) => {
        const newEntryId = 1000
        const newEntryText = 'test'

        let selectedEntry = null
        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
            createNewEntry: async (entryName) => {
                newEntryName = entryName
                return newEntryId
            },
            selectEntry: async (entryId) => {
                selectedEntry = entryId
            },
        })

        await testLogic.init()

        expect(testLogic.state.displayEntries).toEqual(
            DATA.TEST_LIST_SUGGESTIONS,
        )
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [],
            }),
        )

        await testLogic.processEvent('searchInputChanged', {
            query: newEntryText,
        })

        expect(selectedEntry).toBe(null)
        expect(newEntryName).toBe(null)
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: newEntryText,
                newEntryName: newEntryText,
            }),
        )

        await testLogic.processEvent('newEntryPress', { entry: newEntryText })

        expect(selectedEntry).toBe(newEntryId)
        expect(newEntryName).toBe(newEntryText)
        expect(testLogic.state.displayEntries).toEqual([
            expect.objectContaining({
                name: newEntryText,
                localId: newEntryId,
                focused: false,
            }),
            ...DATA.TEST_LIST_SUGGESTIONS,
        ])
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedEntries: [newEntryId],
            }),
        )
    })

    it('should correctly add a new entry to all tabs', async ({ device }) => {
        const newEntryId = 1000
        const newEntryText = 'test'

        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
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
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
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
                    expect.objectContaining({
                        name: newEntryText,
                        localId: newEntryId,
                        focused: false,
                    }),
                    ...DATA.TEST_LIST_SUGGESTIONS,
                ],
            }),
        )
    })
})

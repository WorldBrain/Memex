import 'jest-extended'
import SpacePickerLogic, { SpaceDisplayEntry } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import delay from 'src/util/delay'

async function insertTestData({
    storageManager,
    backgroundModules,
}: UILogicTestDevice) {
    for (const list of DATA.TEST_LISTS) {
        await backgroundModules.customLists.createCustomList({
            createdAt: list.createdAt,
            name: list.name,
            id: list.id,
        })
    }
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
    ...args
}: {
    device: UILogicTestDevice
    createNewEntry?: (name: string) => Promise<number>
    selectEntry?: (id: string | number) => Promise<void>
    unselectEntry?: (id: string | number) => Promise<void>
    queryEntries?: (query: string) => Promise<SpaceDisplayEntry[]>

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
                displayEntries: DATA.TEST_LIST_SUGGESTIONS,
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
            `Space Picker Validation: Can't add entry with only whitespace`,
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
        let selectedEntryId = null
        let unselectedEntryId = null
        const { testLogic } = await setupLogicHelper({
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
        expect(selectedEntryId).toBe(null)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state.selectedEntries).toEqual([
            DATA.TEST_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(DATA.TEST_LIST_SUGGESTIONS[0].localId)
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

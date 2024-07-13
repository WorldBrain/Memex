import SpacePickerLogic from './logic'
import {
    insertBackgroundFunctionTab,
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import {
    EMPTY_SPACE_NAME_ERR_MSG,
    NON_UNIQ_SPACE_NAME_ERR_MSG,
    BAD_CHAR_SPACE_NAME_ERR_MSG,
} from '@worldbrain/memex-common/lib/utils/space-name-validation'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { PageAnnotationsCache } from 'src/annotations/cache'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UnifiedList } from 'src/annotations/cache/types'
import { SpacePickerDependencies } from './types'

async function insertTestData({
    storageManager,
    backgroundModules,
}: UILogicTestDevice) {
    for (const list of DATA.TEST_LISTS) {
        const sharedListMetadata = DATA.TEST_LIST_METADATA.find(
            (meta) => meta.localId === list.id,
        )
        await backgroundModules.customLists.createCustomList({
            createdAt: list.createdAt,
            type: list.type,
            name: list.name,
            id: list.id,
            order: list.order,
            collabKey: sharedListMetadata?.remoteId,
            remoteListId: sharedListMetadata?.remoteId,
        })
    }

    // Ensure no test lists are in the initial suggestions by default
    await backgroundModules.customLists['localStorage'].set('suggestionIds', [])

    for (const metadata of DATA.TEST_LIST_METADATA) {
        await storageManager
            .collection('sharedListMetadata')
            .createObject(metadata)
    }

    for (const followedList of DATA.FOLLOWED_LISTS) {
        await storageManager
            .collection('followedList')
            .createObject(followedList)
    }

    for (const followedListEntry of DATA.FOLLOWED_LIST_ENTRIES) {
        await storageManager
            .collection('followedListEntry')
            .createObject(followedListEntry)
    }
}

const setupLogicHelper = async ({
    device,
    shouldHydrateCacheOnInit,
    initialSelectedListIds,
    skipTestData,
    url,
    ...args
}: {
    device: UILogicTestDevice
    shouldHydrateCacheOnInit?: boolean
    onSpaceCreate?: SpacePickerDependencies['onSpaceCreate']
    selectEntry?: (id: string | number) => Promise<void>
    unselectEntry?: (id: string | number) => Promise<void>
    queryEntries?: (query: string) => Promise<UnifiedList[]>
    initialSelectedListIds?: number[]
    skipTestData?: boolean
    url?: string
}) => {
    if (!skipTestData) {
        await insertTestData(device)
    }

    let generatedIds = 100
    const annotationsCache = new PageAnnotationsCache({})

    const entryPickerLogic = new SpacePickerLogic({
        annotationsCache,
        localStorageAPI: device.browserAPIs.storage.local,
        shouldHydrateCacheOnInit: shouldHydrateCacheOnInit ?? true,
        onSpaceCreate:
            args.onSpaceCreate ??
            (async (name) => ({ localListId: generatedIds++ } as any)),
        selectEntry: args.selectEntry ?? (async (id) => {}),
        unselectEntry: args.unselectEntry ?? (async (id) => {}),
        initialSelectedListIds: async () => initialSelectedListIds ?? [],
        actOnAllTabs: async (entry) => null,
        bgScriptBG: insertBackgroundFunctionTab(
            device.backgroundModules.bgScript.remoteFunctions,
        ) as any,
        contentSharingBG:
            device.backgroundModules.contentSharing.remoteFunctions,
        spacesBG: device.backgroundModules.customLists.remoteFunctions,
        authBG: device.backgroundModules.auth.remoteFunctions,
        pageActivityIndicatorBG:
            device.backgroundModules.pageActivityIndicator.remoteFunctions,
        analyticsBG: device.backgroundModules.analyticsBG,
        getListTreesRef: () => undefined,
        getEntryRowRefs: () => ({}),
    })

    const testLogic = device.createElement(entryPickerLogic)
    return { testLogic, entryPickerLogic, annotationsCache }
}

describe('SpacePickerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to add and remove specific lists to show as trees', async ({
        device,
    }) => {
        const { testLogic, annotationsCache } = await setupLogicHelper({
            device,
        })

        let listA = annotationsCache.addList({
            name: 'a',
            type: 'user-list',
            localId: 1,
            unifiedAnnotationIds: [],
            hasRemoteAnnotationsToLoad: false,
        })
        let listB = annotationsCache.addList({
            name: 'b',
            type: 'user-list',
            localId: 2,
            unifiedAnnotationIds: [],
            hasRemoteAnnotationsToLoad: false,
        })
        let listC = annotationsCache.addList({
            name: 'c',
            type: 'user-list',
            localId: 3,
            parentLocalId: 2,
            unifiedAnnotationIds: [],
            hasRemoteAnnotationsToLoad: false,
        })

        expect(testLogic.state.listIdsShownAsTrees).toEqual([])

        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listA.unifiedId,
        // })
        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listB.unifiedId,
        // })

        // expect(testLogic.state.listIdsShownAsTrees).toEqual([
        //     listA.unifiedId,
        //     listB.unifiedId,
        // ])

        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listB.unifiedId,
        // })

        // expect(testLogic.state.listIdsShownAsTrees).toEqual([listA.unifiedId])

        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listB.unifiedId,
        // })

        // expect(testLogic.state.listIdsShownAsTrees).toEqual([
        //     listA.unifiedId,
        //     listB.unifiedId,
        // ])

        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listA.unifiedId,
        // })
        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listB.unifiedId,
        // })

        // expect(testLogic.state.listIdsShownAsTrees).toEqual([])

        // // C is a child of B, so toggling C then B should result in C in being removed (as it's the same tree)
        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listC.unifiedId,
        // })
        // expect(testLogic.state.listIdsShownAsTrees).toEqual([listC.unifiedId])
        // testLogic.processEvent('toggleListShownAsTree', {
        //     listIndex: listB.unifiedId,
        // })
        // expect(testLogic.state.listIdsShownAsTrees).toEqual([])
    })

    it(
        'should correctly load initial entries',
        async ({ device }) => {
            const { testLogic } = await setupLogicHelper({
                device,
            })

            expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
                [],
            )
            expect(
                normalizedStateToArray(testLogic.state.pageLinkEntries),
            ).toEqual([])
            expect(testLogic.state.selectedListIds).toEqual([])

            await testLogic.init()

            expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
                DATA.TEST_USER_LIST_SUGGESTIONS,
            )
            expect(
                normalizedStateToArray(testLogic.state.pageLinkEntries),
            ).toEqual(DATA.TEST_PAGE_LINK_SUGGESTIONS)
            expect(testLogic.state.selectedListIds).toEqual([])
        },
        { shouldSkip: true },
    )

    // TODO: Fix this test
    it(
        'should correctly load initial entries and set as selected those that are in initial entries',
        async ({ device }) => {
            const { testLogic } = await setupLogicHelper({
                device,
                initialSelectedListIds: [
                    DATA.TEST_LISTS[0].id,
                    DATA.TEST_LISTS[2].id,
                    // These two shouldn't show up in the final display entries
                    SPECIAL_LIST_IDS.INBOX,
                    SPECIAL_LIST_IDS.MOBILE,
                ],
            })

            expect(testLogic.state).toEqual(
                expect.objectContaining({
                    listEntries: initNormalizedState(),
                    selectedListIds: [],
                }),
            )

            await testLogic.init()

            expect(
                normalizedStateToArray(testLogic.state.listEntries),
            ).toEqual([
                DATA.TEST_USER_LIST_SUGGESTIONS[0],
                DATA.TEST_USER_LIST_SUGGESTIONS[2],
                DATA.TEST_USER_LIST_SUGGESTIONS[1],
                DATA.TEST_USER_LIST_SUGGESTIONS[3],
                DATA.TEST_USER_LIST_SUGGESTIONS[4],
                DATA.TEST_USER_LIST_SUGGESTIONS[5],
            ])
            expect(testLogic.state.selectedListIds).toEqual([
                DATA.TEST_LISTS[0].id,
                DATA.TEST_LISTS[2].id,
            ])
        },
        { shouldSkip: true },
    )

    // TODO: Fix this test
    it('should correctly load selected spaces in initial entries, even if not part of recently used suggestions store', async ({
        device,
    }) => {
        return
        const { testLogic } = await setupLogicHelper({
            device,
            initialSelectedListIds: [
                DATA.TEST_LISTS[0].id,
                DATA.TEST_LISTS[2].id,
                // These two shouldn't show up in the final display entries
                SPECIAL_LIST_IDS.INBOX,
                SPECIAL_LIST_IDS.MOBILE,
            ],
        })

        await device.backgroundModules.customLists[
            'localStorage'
        ].set('suggestionIds', [DATA.TEST_LISTS[5].id, DATA.TEST_LISTS[4].id])

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                listEntries: initNormalizedState(),
                selectedListIds: [],
            }),
        )

        await testLogic.init()

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[1],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
        ])
        expect(testLogic.state.selectedListIds).toEqual([
            DATA.TEST_LISTS[0].id,
            DATA.TEST_LISTS[2].id,
        ])
    })

    it('should be able to search for an entry regardless of case', async ({
        device,
    }) => {
        const { testLogic } = await setupLogicHelper({
            device,
        })
        await testLogic.init()
        expect(testLogic.state.query).toEqual('')
        expect(testLogic.state.newEntryName).toEqual('')
        expect(testLogic.state.filteredListIds).toEqual(null)

        await testLogic.processEvent('searchInputChanged', {
            query: 'LIST Test',
        })
        expect(testLogic.state.query).toEqual('LIST Test')
        expect(testLogic.state.newEntryName).toEqual('LIST Test')
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].unifiedId,
        ])

        await testLogic.processEvent('searchInputChanged', {
            query: 'non-existent',
        })
        expect(testLogic.state.query).toEqual('non-existent')
        expect(testLogic.state.newEntryName).toEqual('non-existent')
        expect(testLogic.state.filteredListIds).toEqual([])

        await testLogic.processEvent('searchInputChanged', { query: '' })
        expect(testLogic.state.query).toEqual('')
        expect(testLogic.state.newEntryName).toEqual('')
        expect(testLogic.state.filteredListIds).toEqual(null)

        await testLogic.processEvent('searchInputChanged', {
            query: 'list test',
        })
        expect(testLogic.state.query).toEqual('list test')
        expect(testLogic.state.newEntryName).toEqual('list test')
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].unifiedId,
        ])
    })

    it("should be able to search for any entry when it's already selected", async ({
        device,
    }) => {
        const initialSelectedEntries = [DATA.TEST_LISTS[0].id]

        const { testLogic } = await setupLogicHelper({
            device,
            initialSelectedListIds: initialSelectedEntries,
        })

        await testLogic.init()
        await testLogic.processEvent('searchInputChanged', {
            query: 'list test',
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'list test',
                filteredListIds: [DATA.TEST_USER_LIST_SUGGESTIONS[0].unifiedId],
                selectedListIds: initialSelectedEntries,
            }),
        )
    })

    it('should be able to search for page links via their corresponding page titles', async ({
        device,
    }) => {
        const { testLogic } = await setupLogicHelper({ device })

        await testLogic.init()

        await testLogic.processEvent('searchInputChanged', {
            query: 'May 11th',
        })
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_PAGE_LINK_SUGGESTIONS[1].unifiedId,
        ])

        await testLogic.processEvent('searchInputChanged', {
            query: 'may',
        })
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_PAGE_LINK_SUGGESTIONS[0].unifiedId,
            DATA.TEST_PAGE_LINK_SUGGESTIONS[1].unifiedId,
        ])
    })

    // TODO: Fix this test
    it('should do an inclusive search ANDing all distinct terms given', async ({
        device,
    }) => {
        return
        const { testLogic } = await setupLogicHelper({
            device,
        })
        await testLogic.init()
        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(testLogic.state.filteredListIds).toEqual(null)

        await testLogic.processEvent('searchInputChanged', {
            query: 'list',
            skipDebounce: true,
        })
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].unifiedId,
            DATA.TEST_USER_LIST_SUGGESTIONS[1].unifiedId,
            DATA.TEST_USER_LIST_SUGGESTIONS[2].unifiedId,
            DATA.TEST_USER_LIST_SUGGESTIONS[3].unifiedId,
            DATA.TEST_USER_LIST_SUGGESTIONS[4].unifiedId,
            DATA.TEST_USER_LIST_SUGGESTIONS[5].unifiedId,
        ])

        await testLogic.processEvent('searchInputChanged', {
            query: 'list test',
            skipDebounce: true,
        })
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].unifiedId,
        ])

        await testLogic.processEvent('searchInputChanged', {
            query: 'list diff',
            skipDebounce: true,
        })
        expect(testLogic.state.filteredListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[5].unifiedId,
        ])
    })

    // TODO: Fix this test
    it('should correctly navigate the search results by up and down arrows', async ({
        device,
    }) => {
        return
        const { testLogic, annotationsCache } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                focusedListId: null,
            }),
        )

        const expectStateToEqualWithFocus = (
            focusedEntryId: number,
            iteration: number,
        ) =>
            expect([iteration, testLogic.state.focusedListId]).toEqual([
                iteration,
                annotationsCache.getListByLocalId(focusedEntryId)?.unifiedId ??
                    null,
            ])

        const keyPresses: [KeyEvent, number][] = [
            // ['ArrowDown', DATA.TEST_LISTS[0].id],
            ['ArrowDown', DATA.TEST_LISTS[1].id],
            ['ArrowDown', DATA.TEST_LISTS[2].id],
            ['ArrowDown', DATA.TEST_LISTS[3].id],
            ['ArrowDown', DATA.TEST_LISTS[4].id],
            ['ArrowDown', DATA.TEST_LISTS[5].id],
            ['ArrowDown', DATA.TEST_LISTS[5].id],
            ['ArrowDown', DATA.TEST_LISTS[5].id],
            ['ArrowDown', DATA.TEST_LISTS[5].id],
            ['ArrowUp', DATA.TEST_LISTS[4].id],
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

        let i = 0
        for (const [key, focusedEntryId] of keyPresses) {
            await testLogic.processEvent('keyPress', {
                event: { key } as React.KeyboardEvent<HTMLInputElement>,
            })
            expectStateToEqualWithFocus(focusedEntryId, i)
            i++
        }
    })

    // NOTE: This functionality is disabled
    // it('should trigger props.onSubmit upon ctrl/cmd+Enter press', async ({
    //     device,
    // }) => {
    //     let wasSubmitted = false
    //     const { testLogic } = await setupLogicHelper({
    //         device,
    //         onSubmit: () => (wasSubmitted = true),
    //     })

    //     await testLogic.init()

    //     expect(wasSubmitted).toBe(false)
    //     await testLogic.processEvent('keyPress', {
    //         event: { key: 'Enter' } as KeyboardEvent,
    //     })
    //     expect(wasSubmitted).toBe(false)
    //     await testLogic.processEvent('keyPress', {
    //         event: { key: 'Enter', metaKey: true } as KeyboardEvent,
    //     })
    //     expect(wasSubmitted).toBe(true)
    // })

    it('should correctly validate new entries', async ({ device }) => {
        const { entryPickerLogic, testLogic } = await setupLogicHelper({
            device,
        })
        await testLogic.init()

        expect(entryPickerLogic.validateSpaceName('test').valid).toBe(true)
        expect(entryPickerLogic.validateSpaceName('test test').valid).toBe(true)
        expect(
            entryPickerLogic.validateSpaceName('test test $test %').valid,
        ).toBe(true)
        expect(
            entryPickerLogic.validateSpaceName('test test $test %🤣😁 😅😁')
                .valid,
        ).toBe(true)
        expect(entryPickerLogic.validateSpaceName('   ').valid).toBe(false)
        expect(testLogic.state.renameListErrorMessage).toEqual(
            EMPTY_SPACE_NAME_ERR_MSG,
        )
        expect(entryPickerLogic.validateSpaceName(' test []  ').valid).toBe(
            false,
        )
        expect(testLogic.state.renameListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )
        expect(
            entryPickerLogic.validateSpaceName(
                DATA.TEST_USER_LIST_SUGGESTIONS[0].name,
            ).valid,
        ).toBe(false)
        expect(testLogic.state.renameListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )
    })

    it('should show default entries again after clearing the search query', async ({
        device,
    }) => {
        const { testLogic } = await setupLogicHelper({
            device,
        })
        const newEntryText = 'testwerwerwerwer'

        const expectDefaultState = () => {
            expect(testLogic.state.query).toEqual('')
            expect(testLogic.state.newEntryName).toEqual('')
            expect(testLogic.state.filteredListIds).toEqual(null)
        }

        await testLogic.init()

        expectDefaultState()

        await testLogic.processEvent('searchInputChanged', {
            query: newEntryText,
        })

        expect(testLogic.state.query).toEqual(newEntryText)
        expect(testLogic.state.newEntryName).toEqual(newEntryText)
        expect(testLogic.state.filteredListIds).toEqual([])

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
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(null)

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('toggleEntryContextMenu', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[0].localId,
        })

        expect(testLogic.state.contextMenuListId).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS[0].localId,
        )
    })

    // TODO: Fix this test
    it('should be able to rename list for given entry, and validate new names', async ({
        device,
    }) => {
        return
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })
        const newNameA = 'new list name'
        const newNameB = 'another new list name'

        await testLogic.init()

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(testLogic.state.renameListErrorMessage).toEqual(null)

        // Attempt to re-use another list name - should set error
        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
            name: DATA.TEST_USER_LIST_SUGGESTIONS[0].name,
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(testLogic.state.renameListErrorMessage).toEqual(
            NON_UNIQ_SPACE_NAME_ERR_MSG,
        )

        // Attempt to use a list name with invalid characters - also should set error
        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
            name: DATA.TEST_USER_LIST_SUGGESTIONS[1].name + '[ ( {',
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(testLogic.state.renameListErrorMessage).toEqual(
            BAD_CHAR_SPACE_NAME_ERR_MSG,
        )

        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
            name: newNameA,
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_USER_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(null)

        await testLogic.processEvent('renameList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[3].localId,
            name: newNameB,
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            { ...DATA.TEST_USER_LIST_SUGGESTIONS[1], name: newNameA },
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            { ...DATA.TEST_USER_LIST_SUGGESTIONS[3], name: newNameB },
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.renameListErrorMessage).toEqual(null)
    })

    // TODO: Fix this test

    it('should be delete list for given entry', async ({ device }) => {
        return
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )

        await testLogic.processEvent('deleteList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])

        await testLogic.processEvent('deleteList', {
            listId: DATA.TEST_USER_LIST_SUGGESTIONS[3].localId,
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
    })

    it('should correctly select existing entry for all tabs', async ({
        device,
    }) => {
        const { testLogic, entryPickerLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        expect(testLogic.state.selectedListIds).toEqual([])

        await testLogic.processEvent('resultEntryAllPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[0],
        })
        await entryPickerLogic['processingUpstreamOperation']

        expect(testLogic.state.selectedListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].localId,
        ])
    })

    // TODO: Fix this test
    it('should correctly select/unselect existing entry', async ({
        device,
    }) => {
        return
        let selectedEntryId: string | number = null
        let unselectedEntryId: string | number = null
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

        expect(testLogic.state.selectedListIds).toEqual([])
        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(selectedEntryId).toBe(null)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[1],
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[1],
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.selectedListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_USER_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(null)

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[1],
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[1],
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.selectedListIds).toEqual([])
        expect(selectedEntryId).toBe(DATA.TEST_USER_LIST_SUGGESTIONS[1].localId)
        expect(unselectedEntryId).toBe(
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[0],
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[1],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.selectedListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_USER_LIST_SUGGESTIONS[0].localId)
        expect(unselectedEntryId).toBe(
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[3],
        })

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[3],
            DATA.TEST_USER_LIST_SUGGESTIONS[0],
            DATA.TEST_USER_LIST_SUGGESTIONS[1],
            DATA.TEST_USER_LIST_SUGGESTIONS[2],
            DATA.TEST_USER_LIST_SUGGESTIONS[4],
            DATA.TEST_USER_LIST_SUGGESTIONS[5],
        ])
        expect(testLogic.state.selectedListIds).toEqual([
            DATA.TEST_USER_LIST_SUGGESTIONS[3].localId,
            DATA.TEST_USER_LIST_SUGGESTIONS[0].localId,
        ])
        expect(selectedEntryId).toBe(DATA.TEST_USER_LIST_SUGGESTIONS[3].localId)
        expect(unselectedEntryId).toBe(
            DATA.TEST_USER_LIST_SUGGESTIONS[1].localId,
        )
    })

    // TODO: Fix this test
    it('should clear query upon entry selection', async ({ device }) => {
        return
        const { testLogic } = await setupLogicHelper({
            device,
        })

        await testLogic.init()

        await testLogic.processEvent('searchInputChanged', { query: 'test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                selectedListIds: [],
            }),
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                selectedListIds: [DATA.TEST_USER_LIST_SUGGESTIONS[0].localId],
            }),
        )
        await testLogic.processEvent('searchInputChanged', { query: 'test' })
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: 'test',
                selectedListIds: [DATA.TEST_USER_LIST_SUGGESTIONS[0].localId],
            }),
        )

        await testLogic.processEvent('resultEntryPress', {
            entry: DATA.TEST_USER_LIST_SUGGESTIONS[0],
        })

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                selectedListIds: [],
            }),
        )
    })

    // TODO: Fix this test
    it('should show default entries again + new entry after selecting a new entry', async ({
        device,
    }) => {
        return
        let newEntryId = 1000
        const newEntryText = 'test'

        let selectedEntry = null
        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
            onSpaceCreate: async ({ name, localListId }) => {
                newEntryName = name
                newEntryId = localListId
            },
            selectEntry: async (entryId) => {
                selectedEntry = entryId
            },
        })

        await testLogic.init()

        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
        )
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedListIds: [],
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

        // await testLogic.processEvent('newEntryPress', {
        //     entry: newEntryText,
        // })

        expect(selectedEntry).toBe(newEntryId)
        expect(newEntryName).toBe(newEntryText)
        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            expect.objectContaining({
                name: newEntryText,
                localId: newEntryId,
            }),
            {
                ...DATA.TEST_USER_LIST_SUGGESTIONS[0],
            },
            ...DATA.TEST_USER_LIST_SUGGESTIONS.slice(1),
        ])
        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedListIds: [newEntryId],
            }),
        )
    })

    // TODO: Fix this test

    it('should correctly add a new entry to all tabs', async ({ device }) => {
        return
        let newEntryId = 1000
        const newEntryText = 'test'

        let newEntryName = null
        const { testLogic } = await setupLogicHelper({
            device,
            onSpaceCreate: async ({ name, localListId }) => {
                newEntryName = name
                newEntryId = localListId
            },
        })

        await testLogic.init()

        expect(testLogic.state).toEqual(
            expect.objectContaining({
                query: '',
                newEntryName: '',
                selectedListIds: [],
            }),
        )
        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual(
            DATA.TEST_USER_LIST_SUGGESTIONS,
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
                selectedListIds: [newEntryId],
            }),
        )
        expect(normalizedStateToArray(testLogic.state.listEntries)).toEqual([
            expect.objectContaining({
                name: newEntryText,
                localId: newEntryId,
            }),
            {
                ...DATA.TEST_USER_LIST_SUGGESTIONS[0],
            },
            ...DATA.TEST_USER_LIST_SUGGESTIONS.slice(1),
        ])
    })

    it('should be able to switch tabs', async ({ device }) => {
        const { testLogic } = await setupLogicHelper({ device })

        await testLogic.init()
        expect(testLogic.state.currentTab).toEqual('user-lists')
        await testLogic.processEvent('switchTab', { tab: 'page-links' })
        expect(testLogic.state.currentTab).toEqual('page-links')
        await testLogic.processEvent('switchTab', { tab: 'user-lists' })
        expect(testLogic.state.currentTab).toEqual('user-lists')
        await testLogic.processEvent('switchTab', { tab: 'page-links' })
        expect(testLogic.state.currentTab).toEqual('page-links')
    })

    // TODO: Fix this test
    it('should reset focus on tab switch', async ({ device }) => {
        return

        const {
            testLogic,
            annotationsCache,
            entryPickerLogic,
        } = await setupLogicHelper({
            device,
        })

        await testLogic.init()
        expect(testLogic.state.currentTab).toEqual('user-lists')
        expect(testLogic.state.focusedListId).toEqual(null)
        expect(entryPickerLogic['focusIndex']).toBe(0)

        await testLogic.processEvent('keyPress', {
            event: { key: 'ArrowDown' } as React.KeyboardEvent<
                HTMLInputElement
            >,
        })
        await testLogic.processEvent('keyPress', {
            event: { key: 'ArrowDown' } as React.KeyboardEvent<
                HTMLInputElement
            >,
        })
        await testLogic.processEvent('keyPress', {
            event: { key: 'ArrowDown' } as React.KeyboardEvent<
                HTMLInputElement
            >,
        })
        expect(entryPickerLogic['focusIndex']).toBe(3)
        expect(testLogic.state.focusedListId).toEqual(
            annotationsCache.getListByLocalId(DATA.TEST_LISTS[3].id).unifiedId,
        )

        await testLogic.processEvent('switchTab', { tab: 'page-links' })
        expect(testLogic.state.currentTab).toEqual('page-links')
        expect(entryPickerLogic['focusIndex']).toBe(-1)
        expect(testLogic.state.focusedListId).toEqual(null)

        await testLogic.processEvent('keyPress', {
            event: { key: 'ArrowDown' } as React.KeyboardEvent<
                HTMLInputElement
            >,
        })
        await testLogic.processEvent('keyPress', {
            event: { key: 'ArrowDown' } as React.KeyboardEvent<
                HTMLInputElement
            >,
        })
        expect(entryPickerLogic['focusIndex']).toBe(1)
        expect(testLogic.state.focusedListId).toEqual(
            DATA.TEST_PAGE_LINK_SUGGESTIONS[1].unifiedId,
        )

        await testLogic.processEvent('switchTab', { tab: 'user-lists' })
        expect(testLogic.state.currentTab).toEqual('user-lists')
        expect(entryPickerLogic['focusIndex']).toBe(-1)
        expect(testLogic.state.focusedListId).toEqual(null)
    })
})

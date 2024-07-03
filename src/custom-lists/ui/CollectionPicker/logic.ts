import { UILogic, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'
import type { CollectionsSettings } from 'src/custom-lists/background/types'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'
import type {
    PageAnnotationsCacheEvents,
    UnifiedList,
} from 'src/annotations/cache/types'
import { siftListsIntoCategories } from 'src/annotations/cache/utils'
import {
    NormalizedState,
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { hydrateCacheForListUsage } from 'src/annotations/cache/utils'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { BrowserSettingsStore } from 'src/util/settings'
import { getEntriesForCurrentPickerTab } from './utils'
import type {
    SpacePickerState,
    SpacePickerEvent,
    SpacePickerDependencies,
} from './types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { sleepPromise } from 'src/util/promises'
import type { State as ListTreesState } from '../list-trees/types'

type EventHandler<EventName extends keyof SpacePickerEvent> = UIEventHandler<
    SpacePickerState,
    SpacePickerEvent,
    EventName
>

// TODO: Simplify this sorting logic if possible.
//  Was struggling to wrap my head around this during implemention, though got it working but feel it could be simpler
const sortDisplayEntries = (
    selectedEntryIds: number[],
    localListIdsMRU: number[],
) => (a: UnifiedList, b: UnifiedList): number => {
    const aSelectedScore = selectedEntryIds.indexOf(a.localId) + 1
    const bSelectedScore = selectedEntryIds.indexOf(b.localId) + 1

    // First sorting prio is whether a list is selected or not
    if (aSelectedScore || bSelectedScore) {
        if (aSelectedScore && !bSelectedScore) {
            return -1
        }
        if (!aSelectedScore && bSelectedScore) {
            return 1
        }
        return aSelectedScore - bSelectedScore
    }

    // Second sorting prio is MRU
    const aMRUScore = localListIdsMRU.indexOf(a.localId) + 1
    const bMRUScore = localListIdsMRU.indexOf(b.localId) + 1

    if (aMRUScore && !bMRUScore) {
        return -1
    }
    if (!aMRUScore && bMRUScore) {
        return 1
    }
    return aMRUScore - bMRUScore
}

/**
 * This exists as a temporary way to resolve local list IDs -> cache state data, delaying a lot of
 * space picker refactoring to move it to fully work on the cache.
 * TODO: Update all the events to use unifiedIds instead of localIds, and remove this function.
 */
const __getListDataByLocalId = (
    localId: number,
    { annotationsCache }: Pick<SpacePickerDependencies, 'annotationsCache'>,
    opts?: {
        source?: keyof SpacePickerEvent
        mustBeLocal?: boolean
    },
): UnifiedList => {
    const listData = annotationsCache.getListByLocalId(localId)
    const source = opts?.source ? `for ${opts.source} ` : ''

    if (!listData) {
        throw new Error(`Specified list data ${source}could not be found`)
    }
    if (opts?.mustBeLocal && listData.localId == null) {
        throw new Error(
            `Specified list data ${source}could not be found locally`,
        )
    }
    return listData
}

export default class SpacePickerLogic extends UILogic<
    SpacePickerState,
    SpacePickerEvent
> {
    private searchInputRef?: HTMLInputElement
    private newTabKeys: KeyEvent[] = ['Enter', ',', 'Tab']
    private currentKeysPressed: KeyEvent[] = []
    private localStorage: BrowserSettingsStore<CollectionsSettings>
    /** Mirrors the state of the same name, for use in the sorting fn. */
    private selectedListIds: number[] = []
    private localListIdsMRU: number[] = []

    /**
     * Exists to have a numerical representation for the `focusedListId` state according
     * to visual order, affording simple math on it.
     * -1 means nothing focused, other numbers correspond to focused index of `defaultEntries.allIds` state
     */
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private processingUpstreamOperation: Promise<void>

    constructor(
        protected dependencies: SpacePickerDependencies & {
            /** Allows direct access to list tree state encapsulated in ListTrees container component. */
            getListTreeState: () => ListTreesState
        },
    ) {
        super()
        this.localStorage = new BrowserSettingsStore(
            dependencies.localStorageAPI,
            { prefix: 'custom-lists_' },
        )
    }

    getInitialState = (): SpacePickerState => ({
        query: '',
        newEntryName: '',
        currentTab: 'user-lists',
        currentUser: null,
        focusedListId: null,
        listEntries: initNormalizedState(),
        pageLinkEntries: initNormalizedState(),
        selectedListIds: [],
        filteredListIds: null,
        loadState: 'pristine',
        spaceCreateState: 'pristine',
        spaceAddRemoveState: 'pristine',
        spaceWriteError: null,
        renameListErrorMessage: null,
        contextMenuListId: null,
        keyboardNavActive: false,
        addedToAllIds: [],
        editMenuListId: null,
    })

    private cacheListsSubscription: PageAnnotationsCacheEvents['newListsState']

    private cacheAnnotationUpdatedSubscription: PageAnnotationsCacheEvents['updatedAnnotation'] = (
        updatedAnnot,
    ) => {}

    private initCacheListsSubscription = (
        currentUser?: UserReference,
    ): PageAnnotationsCacheEvents['newListsState'] => (nextLists) => {
        const { myLists, joinedLists, pageLinkLists } = siftListsIntoCategories(
            normalizedStateToArray(nextLists),
            currentUser,
        )

        const sortPredicate = sortDisplayEntries(
            this.selectedListIds,
            this.localListIdsMRU,
        )

        const toSet = initNormalizedState({
            getId: (list) => list.unifiedId,
            seedData: [...myLists, ...joinedLists]
                .filter(
                    (list) => list.type === 'user-list' && list.localId != null,
                )
                .sort(sortPredicate) as UnifiedList<'user-list'>[],
        })

        this.emitMutation({
            listEntries: {
                $set: toSet,
            },
            pageLinkEntries: {
                $set: initNormalizedState({
                    getId: (list) => list.unifiedId,
                    seedData: pageLinkLists
                        .filter((list) => list.localId != null)
                        .sort(sortPredicate),
                }),
            },
        })
    }

    init: EventHandler<'init'> = async () => {
        await loadInitial(this, async () => {
            const user = await this.dependencies.authBG.getCurrentUser()
            const currentUser: UserReference = user
                ? { type: 'user-reference', id: user.id }
                : undefined
            this.emitMutation({ currentUser: { $set: currentUser ?? null } })

            this.localListIdsMRU =
                (await this.localStorage.get('suggestionIds')) ?? []

            if (this.dependencies.initialSelectedListIds) {
                this.selectedListIds = (
                    (await this.dependencies.initialSelectedListIds()) ?? []
                ).filter(
                    (localListId) =>
                        !Object.values(SPECIAL_LIST_IDS).includes(localListId),
                )
                this.emitMutation({
                    selectedListIds: { $set: [...this.selectedListIds] },
                })
            }

            this.cacheListsSubscription = this.initCacheListsSubscription(
                currentUser,
            )

            this.dependencies.annotationsCache.events.addListener(
                'newListsState',
                this.cacheListsSubscription,
            )
            this.dependencies.annotationsCache.events.addListener(
                'updatedAnnotation',
                this.cacheAnnotationUpdatedSubscription,
            )

            if (this.dependencies.shouldHydrateCacheOnInit) {
                await hydrateCacheForListUsage({
                    user: currentUser,
                    cache: this.dependencies.annotationsCache,
                    bgModules: {
                        bgScript: this.dependencies.bgScriptBG,
                        customLists: this.dependencies.spacesBG,
                        contentSharing: this.dependencies.contentSharingBG,
                        pageActivityIndicator: this.dependencies
                            .pageActivityIndicatorBG,
                    },
                })
            } else {
                // Manually run subscription to seed state with any existing cache data
                this.cacheListsSubscription(
                    this.dependencies.annotationsCache.lists,
                )
            }

            if (this.selectedListIds.length > 0) {
                this.emitMutation({
                    focusedListId: {
                        $set:
                            this.dependencies.annotationsCache.getListByLocalId(
                                this.selectedListIds[0],
                            )?.unifiedId ?? null,
                    },
                })
            } else {
                this.emitMutation({
                    focusedListId: {
                        $set:
                            this.dependencies.annotationsCache.getListByLocalId(
                                this.localListIdsMRU[0],
                            )?.unifiedId ?? null,
                    },
                })
            }
            this.focusIndex = 0
        })
    }

    cleanup: EventHandler<'cleanup'> = async ({}) => {
        if (this.cacheListsSubscription) {
            this.dependencies.annotationsCache.events.removeListener(
                'newListsState',
                this.cacheListsSubscription,
            )
        }
        this.dependencies.annotationsCache.events.removeListener(
            'updatedAnnotation',
            this.cacheAnnotationUpdatedSubscription,
        )
    }

    setSearchInputRef: EventHandler<'setSearchInputRef'> = ({
        event: { ref },
        previousState,
    }) => {
        this.searchInputRef = ref
    }

    focusInput: EventHandler<'focusInput'> = () => {
        this.searchInputRef?.focus()
    }

    onKeyUp: EventHandler<'onKeyUp'> = async ({ event: { event } }) => {
        let currentKeys = this.currentKeysPressed
        if (currentKeys.includes('Meta')) {
            this.currentKeysPressed = []
            return
        }
        currentKeys = currentKeys.filter((key) => key !== event.key)
        this.currentKeysPressed = currentKeys
    }

    switchTab: EventHandler<'switchTab'> = async ({ event, previousState }) => {
        if (previousState.currentTab !== event.tab) {
            this.emitMutation({ currentTab: { $set: event.tab } })
            this.setFocusedEntryIndex(-1, previousState)
        }
    }

    keyPress: EventHandler<'keyPress'> = async ({
        event: { event },
        previousState,
    }) => {
        let currentKeys: KeyEvent[] = this.currentKeysPressed
        let keyPressed: any = event.key
        currentKeys.push(keyPressed)

        this.currentKeysPressed = currentKeys

        if (
            (!this.dependencies.filterMode &&
                currentKeys.includes('Enter') &&
                currentKeys.includes('Meta')) ||
            (event.key === 'Enter' &&
                previousState.filteredListIds?.length === 0)
        ) {
            if (previousState.newEntryName !== '') {
                await this.newEntryPress({
                    previousState,
                    event: { entry: previousState.newEntryName },
                })
            }
            this.currentKeysPressed = []
            return
        }

        // if (event.key === 'Enter' && this.dependencies.onSubmit) {
        //     await this.dependencies.onSubmit()
        // }

        if (
            this.newTabKeys.includes(event.key as KeyEvent) &&
            previousState.listEntries.allIds.length > 0
        ) {
            if (previousState.listEntries.byId[previousState.focusedListId]) {
                await this.resultEntryPress({
                    event: {
                        entry:
                            previousState.listEntries.byId[
                                previousState.focusedListId
                            ],
                    },
                    previousState,
                })
                this.currentKeysPressed = []
                return
            }
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            this.emitMutation({ keyboardNavActive: { $set: true } })
            this.setFocusedEntryIndex(this.focusIndex - 1, previousState)
            await sleepPromise(50)
            this.emitMutation({ keyboardNavActive: { $set: false } })
            return
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            this.emitMutation({ keyboardNavActive: { $set: true } })
            this.setFocusedEntryIndex(this.focusIndex + 1, previousState)
            await sleepPromise(50)
            this.emitMutation({ keyboardNavActive: { $set: false } })
            return
        }
        if (event.key === 'Escape') {
            this.dependencies.closePicker(event)
        }
        event.stopPropagation()
    }

    openListInWebUI: EventHandler<'openListInWebUI'> = async ({ event }) => {
        const listData = this.dependencies.annotationsCache.lists.byId[
            event.unifiedListId
        ]
        if (!listData?.remoteId) {
            throw new Error(
                'Cannot open Space in web UI - not tracked in UI state OR not shared',
            )
        }
        const url =
            listData.type === 'page-link'
                ? getSinglePageShareUrl({
                      remoteListId: listData.remoteId,
                      remoteListEntryId: listData.sharedListEntryId,
                  })
                : getListShareUrl({ remoteListId: listData.remoteId })
        window.open(url, '_blank')
    }

    toggleEntryContextMenu: EventHandler<'toggleEntryContextMenu'> = async ({
        event,
        previousState,
    }) => {
        const nextListId =
            previousState.contextMenuListId === event.listId
                ? null
                : event.listId
        this.emitMutation({ contextMenuListId: { $set: nextListId } })
    }

    toggleEntryEditMenu: EventHandler<'toggleEntryEditMenu'> = async ({
        event,
        previousState,
    }) => {
        const nextListId =
            previousState.editMenuListId === event.listId ? null : event.listId
        this.emitMutation({ editMenuListId: { $set: nextListId } })
    }

    onOpenInTabGroupPress: EventHandler<'onOpenInTabGroupPress'> = async ({
        event,
        previousState,
    }) => {
        await this.dependencies.spacesBG.createTabGroup(event.listId)
    }

    validateSpaceName(name: string, listIdToSkip?: number) {
        const validationResult = validateSpaceName(
            name,
            normalizedStateToArray(
                this.dependencies.annotationsCache.lists,
            ).map((entry) => ({
                id: entry.localId,
                name: entry.name,
            })),
            { listIdToSkip },
        )

        this.emitMutation({
            renameListErrorMessage: {
                $set:
                    validationResult.valid === false
                        ? validationResult.reason
                        : null,
            },
        })

        return validationResult
    }

    setListPrivacy: EventHandler<'setListPrivacy'> = async ({ event }) => {
        const { annotationsCache, contentSharingBG } = this.dependencies
        const unifiedId = annotationsCache.getListByLocalId(event.listId)
            ?.unifiedId
        if (unifiedId == null) {
            throw new Error('Tried to set privacy for non-cached list')
        }
        annotationsCache.updateList({
            unifiedId,
            isPrivate: event.isPrivate,
        })

        await contentSharingBG.updateListPrivacy({
            localListId: event.listId,
            isPrivate: event.isPrivate,
        })
    }

    renameList: EventHandler<'renameList'> = async ({ event }) => {
        const newName = event.name.trim()
        const listData = __getListDataByLocalId(
            event.listId,
            this.dependencies,
            { source: 'renameList', mustBeLocal: true },
        )
        if (listData.name === newName) {
            return
        }
        const validationResult = this.validateSpaceName(newName, event.listId)
        if (validationResult.valid === false) {
            this.emitMutation({
                renameListErrorMessage: {
                    $set: validationResult.reason,
                },
            })
            return
        }

        this.dependencies.annotationsCache.updateList({
            unifiedId: listData.unifiedId,
            name: newName,
        })

        await this.dependencies.spacesBG.updateListName({
            id: listData.localId,
            oldName: listData.name,
            newName,
        })

        // NOTE: Done in SpaceContextMenuLogic
        // await this.dependencies.spacesBG.updateListName({
        //     id: event.listId,
        //     newName: event.name,
        //     oldName: previousState.listEntries[stateEntryIndex].name,
        // })
    }

    deleteList: EventHandler<'deleteList'> = async ({ event }) => {
        const listData = __getListDataByLocalId(
            event.listId,
            this.dependencies,
            { source: 'deleteList', mustBeLocal: true },
        )
        this.dependencies.annotationsCache.removeList(listData)

        // NOTE: Done in SpaceContextMenuLogic
        // await this.dependencies.spacesBG.removeList({ id: event.listId })

        this.emitMutation({
            contextMenuListId: { $set: null },
            editMenuListId: { $set: null },
        })
    }

    searchInputChanged: EventHandler<'searchInputChanged'> = ({
        event: { query },
        previousState,
    }) => {
        this.emitMutation({
            query: { $set: query },
            newEntryName: { $set: query },
        })

        if (!query.trim().length) {
            this.emitMutation({ filteredListIds: { $set: null } })
        } else {
            this.querySpaces(query, previousState)
        }
    }

    private querySpaces = (query: string, state: SpacePickerState) => {
        const distinctTerms = query.split(/\s+/).filter(Boolean)
        const doAllTermsMatch = (list: UnifiedList): boolean =>
            distinctTerms.reduce((acc, term) => {
                return (
                    acc &&
                    list.name
                        .toLocaleLowerCase()
                        .includes(term.toLocaleLowerCase())
                )
            }, true)

        const matchingEntryIds = [
            ...normalizedStateToArray(state.listEntries),
            ...normalizedStateToArray(state.pageLinkEntries),
        ]
            .filter(doAllTermsMatch)
            .flatMap((entry) => [entry.unifiedId, ...entry.pathUnifiedIds])

        this.maybeSetCreateEntryDisplay(query, state)

        const mutation: UIMutation<SpacePickerState> = {
            filteredListIds: { $set: matchingEntryIds },
            query: { $set: query },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(state, mutation)

        if (
            state.filteredListIds != null &&
            state.filteredListIds.length != nextState.filteredListIds.length
        ) {
            this.setFocusedEntryIndex(0, nextState, true)
        }

        if (state.query.length > 0 && nextState.query.length === 0) {
            const listData: NormalizedState<UnifiedList> = this.dependencies
                .annotationsCache.lists

            const userLists = normalizedStateToArray(listData)
            const sortPredicate = sortDisplayEntries(
                this.selectedListIds,
                this.localListIdsMRU,
            )

            const toSet = initNormalizedState({
                getId: (list) => list.unifiedId,
                seedData: [...userLists]
                    .filter(
                        (list) =>
                            list.type === 'user-list' && list.localId != null,
                    )
                    .sort(sortPredicate) as UnifiedList<'user-list'>[],
            })

            const mutation: UIMutation<SpacePickerState> = {
                selectedListIds: { $set: this.selectedListIds },
                filteredListIds: { $set: null },
                listEntries: { $set: toSet },
            }

            this.emitMutation(mutation)

            const nextState = this.withMutation(state, mutation)
            this.setFocusedEntryIndex(0, nextState)
        }
    }

    /**
     * If the term provided does not exist in the entry list, then set the new entry state to the term.
     * (the 'Add a new Space: ...' top entry)
     */
    private maybeSetCreateEntryDisplay = (
        input: string,
        state: SpacePickerState,
    ) => {
        const _input = input.trim()
        const alreadyExists = normalizedStateToArray(state.listEntries).reduce(
            (acc, entry) => acc || entry.name === _input,
            false,
        )

        if (alreadyExists) {
            this.emitMutation({ newEntryName: { $set: '' } })
            // N.B. We update this focus index to this found entry, so that
            // enter keys will action it. But we don't emit that focus
            // to the user, because otherwise the style of the button changes
            // showing the tick and it might seem like it's already selected.
            this.setFocusedEntryIndex(1, state, false)
            return
        }

        if (state.query.length > 0) {
            const { valid } = this.validateSpaceName(_input)
            if (!valid) {
                return
            }
        }
        this.emitMutation({ newEntryName: { $set: _input } })
        this.setFocusedEntryIndex(-1, state)
    }

    private setFocusedEntryIndex = (
        nextFocusIndex: number | null,
        state: SpacePickerState,
        emit = true,
    ) => {
        let entries = getEntriesForCurrentPickerTab(state)
        if (state.filteredListIds?.length) {
            entries = entries.filter((entry) =>
                state.filteredListIds.includes(entry.unifiedId),
            )
        }

        if (nextFocusIndex < 0 || nextFocusIndex >= entries.length) {
            return
        }

        this.focusIndex = nextFocusIndex ?? 0
        const focusEntryData = entries[nextFocusIndex]

        if (emit) {
            this.emitMutation({
                focusedListId: { $set: focusEntryData?.unifiedId ?? null },
            })
        }
    }

    resultEntryPress: EventHandler<'resultEntryPress'> = async ({
        event: { entry, shouldRerender },
        previousState,
    }) => {
        let nextState: SpacePickerState
        const listData = __getListDataByLocalId(
            entry.localId,
            this.dependencies,
            { source: 'resultEntryPress' },
        )

        await executeUITask(this, 'spaceAddRemoveState', async () => {
            try {
                let entrySelectPromise: Promise<void | boolean> | void
                // If we're going to unselect it
                if (previousState.selectedListIds.includes(entry.localId)) {
                    this.selectedListIds = previousState.selectedListIds.filter(
                        (id) => id !== entry.localId,
                    )

                    entrySelectPromise = this.dependencies.unselectEntry(
                        entry.localId,
                    )
                } else {
                    // If we're going to select it
                    this.localListIdsMRU = Array.from(
                        new Set([listData.localId, ...this.localListIdsMRU]),
                    )
                    this.selectedListIds = Array.from(
                        new Set([
                            listData.localId,
                            ...previousState.selectedListIds,
                        ]),
                    )

                    entrySelectPromise = this.dependencies.selectEntry(
                        entry.localId,
                    )
                }

                nextState = this.applyAndEmitMutation(previousState, {
                    selectedListIds: { $set: this.selectedListIds },
                })

                // Manually trigger list subscription - which does the list state mutation - as it won't be auto-triggered here
                if (shouldRerender) {
                    this.cacheListsSubscription(
                        this.dependencies.annotationsCache.lists,
                    )
                }

                let entrySelectResult = null
                if (entrySelectPromise instanceof Promise) {
                    entrySelectResult = await entrySelectPromise
                } else {
                    entrySelectPromise = entrySelectPromise
                }

                if (entrySelectResult === false) {
                    nextState = this.applyAndEmitMutation(previousState, {
                        selectedListIds: {
                            $set: previousState.selectedListIds,
                        },
                    })
                }
            } catch (e) {
                this.selectedListIds = previousState.selectedListIds
                nextState = this.applyAndEmitMutation(previousState, {
                    spaceWriteError: { $set: e.message },
                    selectedListIds: { $set: this.selectedListIds },
                })
                throw e
            }
        })

        this.searchInputChanged({
            event: { query: previousState.query },
            previousState: nextState,
        })
    }

    resultEntryAllPress: EventHandler<'resultEntryAllPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        await executeUITask(this, 'spaceAddRemoveState', async () => {
            this.processingUpstreamOperation = this.dependencies.actOnAllTabs(
                entry.localId,
            )

            const selectedIds = [
                entry.localId,
                ...previousState.selectedListIds,
            ]

            let addedToAllIdsnew = [
                parseFloat(entry.unifiedId),
                ...(previousState.addedToAllIds ?? []),
            ]

            this.emitMutation({
                selectedListIds: { $set: selectedIds },
                addedToAllIds: { $set: addedToAllIdsnew },
            })
            this.selectedListIds = selectedIds

            try {
                await this.processingUpstreamOperation
            } catch (e) {
                this.emitMutation({ spaceWriteError: { $set: e.message } })
                throw e
            }
        })
    }

    private async createAndDisplayNewList(
        name: string,
        previousState: SpacePickerState,
    ): Promise<number> {
        if (this.dependencies.filterMode) {
            return
        }

        const {
            collabKey,
            localListId,
            remoteListId,
        } = await this.dependencies.spacesBG.createCustomList({ name })
        this.dependencies.onSpaceCreate?.({
            name,
            localListId,
            collabKey,
            remoteListId,
        })
        this.dependencies.annotationsCache.addList({
            name,
            collabKey,
            localId: localListId,
            remoteId: remoteListId,
            hasRemoteAnnotationsToLoad: false,
            type: 'user-list',
            unifiedAnnotationIds: [],
            creator: previousState.currentUser ?? undefined,
            parentLocalId: null,
            isPrivate: true,
        })

        this.localListIdsMRU.unshift(localListId)
        this.selectedListIds.unshift(localListId)

        const listData = this.dependencies.annotationsCache.lists

        const userLists = normalizedStateToArray(listData)
        const sortPredicate = sortDisplayEntries(
            this.selectedListIds,
            this.localListIdsMRU,
        )

        const toSet = initNormalizedState({
            getId: (list) => list.unifiedId,
            seedData: [...userLists]
                .filter(
                    (list) => list.type === 'user-list' && list.localId != null,
                )
                .sort(sortPredicate) as UnifiedList<'user-list'>[],
        })

        this.emitMutation({
            query: { $set: '' },
            newEntryName: { $set: '' },
            selectedListIds: { $set: this.selectedListIds },
        })

        const mutation: UIMutation<SpacePickerState> = {
            selectedListIds: { $set: this.selectedListIds },
            filteredListIds: { $set: null },
            listEntries: { $set: toSet },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        this.setFocusedEntryIndex(0, nextState)

        return localListId
    }

    setSpaceWriteError: EventHandler<'setSpaceWriteError'> = async ({
        event,
    }) => {
        this.emitMutation({
            spaceWriteError: { $set: event.error },
        })
    }

    newEntryPress: EventHandler<'newEntryPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        await executeUITask(this, 'spaceCreateState', async () => {
            // NOTE: This is here as the enter press event from the context menu to confirm a space rename
            //   was also bubbling up into the space menu and being interpretted as a new space confirmation.
            //   Resulting in both a new space create + existing space rename. This is a hack to prevent that.
            if (previousState.contextMenuListId != null) {
                return
            }

            const { valid } = this.validateSpaceName(entry)
            if (!valid) {
                return
            }
            try {
                const listId = await this.createAndDisplayNewList(
                    entry,
                    previousState,
                )
                await this.dependencies.selectEntry(listId)
            } catch (err) {
                this.emitMutation({ spaceWriteError: { $set: err.message } })
                throw err
            }
        })
    }

    newEntryAllPress: EventHandler<'newEntryAllPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        let newSpaceId: number
        const { success } = await executeUITask(
            this,
            'spaceCreateState',
            async () => {
                try {
                    newSpaceId = await this.createAndDisplayNewList(
                        entry,
                        previousState,
                    )
                } catch (e) {
                    this.emitMutation({ spaceWriteError: { $set: e.message } })
                    throw e
                }
            },
        )
        if (!success) {
            return
        }

        await executeUITask(this, 'spaceAddRemoveState', async () => {
            this.processingUpstreamOperation = this.dependencies.actOnAllTabs(
                newSpaceId,
            )
            try {
                await this.processingUpstreamOperation
            } catch (e) {
                this.emitMutation({ spaceWriteError: { $set: e.message } })
                throw e
            }
        })
    }

    resultEntryFocus: EventHandler<'resultEntryFocus'> = ({
        event: { entry, index },
        previousState,
    }) => {
        this.setFocusedEntryIndex(index, previousState)
    }
}

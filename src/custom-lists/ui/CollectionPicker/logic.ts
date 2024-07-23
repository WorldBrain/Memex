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
import {
    extractUnifiedIdsFromRenderedId,
    generateRenderedListEntryId,
    getEntriesForCurrentPickerTab,
    isRenderedListEntryIdForTreeNode,
} from './utils'
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
import type { ListTrees } from '../list-trees'
import { getVisibleTreeNodesInOrder } from '../list-trees/util'
import type EntryRow from './components/EntryRow'

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
    private localStorage: BrowserSettingsStore<CollectionsSettings>
    /** Mirrors the state of the same name, for use in the sorting fn. */
    private selectedListIds: number[] = []
    private localListIdsMRU: number[] = []

    // For now, the only thing that needs to know if this has finished, is the tests.
    private processingUpstreamOperation: Promise<void>

    constructor(
        protected dependencies: SpacePickerDependencies & {
            /** Allows direct access to list tree state encapsulated in ListTrees container component. */
            getListTreeRefs: () => { [unifiedId: string]: ListTrees }
            /** Allows direct access to each EntryRow comp. Each referenced to via their rendered ID (NOT unified ID). */
            getEntryRowRefs: () => { [renderedId: string]: EntryRow }
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
        newEntryName: [],
        currentTab: 'user-lists',
        currentUser: null,
        focusedListRenderedId: null,
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
        listIdsShownAsTrees: [],
        listIdToShowNewChildInput: null,
        addedToAllIds: [],
        editMenuListId: null,
        blockMouseOver: false,
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
                    focusedListRenderedId: {
                        $set:
                            this.dependencies.annotationsCache.getListByLocalId(
                                this.selectedListIds[0],
                            )?.unifiedId ?? null,
                    },
                })
            } else {
                this.emitMutation({
                    focusedListRenderedId: {
                        $set:
                            this.dependencies.annotationsCache.getListByLocalId(
                                this.localListIdsMRU[0],
                            )?.unifiedId ?? null,
                    },
                })
            }
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

    toggleListShownAsTree: EventHandler<'toggleListShownAsTree'> = ({
        event,
        previousState,
    }) => {
        let {
            baseUnifiedId,
            treeNodeUnifiedId,
        } = extractUnifiedIdsFromRenderedId(event.listRenderedId)

        // Toggling a flat-view entry (i.e., no tree node part in the rendered ID) can only mean we're changing it to be a tree-view entry
        if (!treeNodeUnifiedId) {
            this.emitMutation({
                listIdsShownAsTrees: {
                    $apply: (ids: string[]) =>
                        ids.includes(baseUnifiedId)
                            ? ids
                            : [...ids, baseUnifiedId],
                },
                listIdToShowNewChildInput: {
                    $set: event.shouldShowNewChildInput ? baseUnifiedId : null,
                },
            })
            return
        }

        let cachedList = this.dependencies.annotationsCache.lists.byId[
            treeNodeUnifiedId
        ]
        if (!cachedList) {
            throw new Error(
                'Attempted to toggle tree view for list ID that does not exist in cache',
            )
        }

        // The only other case of interest is toggling closed a tree-view's root entry
        if (cachedList.parentUnifiedId != null) {
            return
        }

        this.emitMutation({
            listIdToShowNewChildInput: { $set: null },
            listIdsShownAsTrees: {
                $set: previousState.listIdsShownAsTrees.filter(
                    (id) => id !== baseUnifiedId,
                ),
            },
        })
    }

    focusInput: EventHandler<'focusInput'> = () => {
        this.searchInputRef?.focus()
    }

    switchTab: EventHandler<'switchTab'> = async ({ event, previousState }) => {
        if (previousState.currentTab !== event.tab) {
            this.emitMutation({ currentTab: { $set: event.tab } })
            this.calcNextFocusedEntry(previousState)
        }
    }

    private deriveFlatListOfRenderedEntries(
        state: SpacePickerState,
    ): Array<UnifiedList & { renderedId: string }> {
        let listTreesRefs = this.dependencies.getListTreeRefs()
        let areListsBeingFiltered = state.query.trim().length > 0

        let baseEntries = getEntriesForCurrentPickerTab(
            this.dependencies,
            state,
        )
        if (state.filteredListIds?.length > 0) {
            baseEntries = baseEntries.filter((e) =>
                state.filteredListIds.includes(e.unifiedId),
            )
        }

        // For each entry, expand it into its entire (flattened) tree if tree view mode is set
        return baseEntries.flatMap((baseEntry) => {
            if (!state.listIdsShownAsTrees.includes(baseEntry.unifiedId)) {
                return {
                    ...baseEntry,
                    renderedId: generateRenderedListEntryId(baseEntry),
                }
            }
            let listTreeState = listTreesRefs[baseEntry.unifiedId]?.state
            if (!listTreeState) {
                return []
            }
            let allTreeMembers = this.dependencies.annotationsCache.getAllListsInTreeByRootId(
                baseEntry.pathUnifiedIds[0],
            )
            return getVisibleTreeNodesInOrder(allTreeMembers, listTreeState, {
                areListsBeingFiltered,
            }).map((listNodeEntry) => ({
                ...listNodeEntry,
                renderedId: generateRenderedListEntryId(
                    baseEntry,
                    listNodeEntry,
                ),
            }))
        })
    }

    private calcNextFocusedEntry(
        state: SpacePickerState,
        change: -1 | 1 = null,
        overriddenFocusedListId?: string,
    ): string {
        let renderedEntries = this.deriveFlatListOfRenderedEntries(state)

        let currentIndex = -1
        if (state.focusedListRenderedId != null) {
            currentIndex = renderedEntries.findIndex(
                (node) => node.renderedId === state.focusedListRenderedId,
            )
        }

        if (overriddenFocusedListId) {
            currentIndex = renderedEntries.findIndex(
                (node) => node.renderedId === overriddenFocusedListId,
            )
        }

        let nextIndex = currentIndex === -1 ? 0 : currentIndex + change

        // Loop back around if going out-of-bounds
        if (nextIndex < 0) {
            nextIndex = renderedEntries.length - 1
        } else if (nextIndex >= renderedEntries.length) {
            nextIndex = 0
        }

        let nextFocusedListId = renderedEntries[nextIndex]?.renderedId
        if (nextFocusedListId != null) {
            this.emitMutation({
                focusedListRenderedId: { $set: nextFocusedListId },
            })
        }
        return nextFocusedListId
    }

    // TODO: I'm not satisfied that this conditional logic is as clear as it could be. Improve
    private async handleLeftRightArrowKeyPress(
        state: SpacePickerState,
        key: 'ArrowLeft' | 'ArrowRight',
    ) {
        let {
            baseUnifiedId,
            treeNodeUnifiedId,
        } = extractUnifiedIdsFromRenderedId(state.focusedListRenderedId)

        let listTreeRootNoteId =
            state.listEntries.byId[treeNodeUnifiedId]?.pathUnifiedIds[0] ??
            treeNodeUnifiedId
        let isEventHappeningOnRootNode =
            listTreeRootNoteId === treeNodeUnifiedId
        let isEventHappeningOnBaseEntry = treeNodeUnifiedId == null

        if (isEventHappeningOnBaseEntry) {
            if (key === 'ArrowRight') {
                listTreeRootNoteId =
                    state.listEntries.byId[baseUnifiedId]?.pathUnifiedIds[0] ??
                    baseUnifiedId
                // Should only be able to unfold trees for nested lists
                if (listTreeRootNoteId == null) {
                    return
                }
                // Figure out what the rendered ID of the tree's root would be, and focus that
                let renderedId = generateRenderedListEntryId(
                    {
                        unifiedId: baseUnifiedId,
                    },
                    { unifiedId: listTreeRootNoteId },
                )
                this.emitMutation({
                    focusedListRenderedId: { $set: renderedId },
                    listIdsShownAsTrees: { $push: [baseUnifiedId] },
                })
            }
            return
        }

        let listTrees = this.dependencies.getListTreeRefs()[baseUnifiedId]
        if (!listTrees) {
            throw new Error(
                'Attempted to toggle list tree with KB arrows, though ref cannot be found.',
            )
        }

        let listTreeState = listTrees.state.listTrees.byId[treeNodeUnifiedId]
        if (
            (key === 'ArrowLeft' &&
                listTreeState?.areChildrenShown === true &&
                !isEventHappeningOnRootNode) ||
            (key === 'ArrowRight' && listTreeState?.areChildrenShown === false)
        ) {
            await listTrees.processEvent('toggleShowChildren', {
                listId: treeNodeUnifiedId,
            })
        } else if (
            key === 'ArrowLeft' &&
            listTreeState?.areChildrenShown === true &&
            isEventHappeningOnRootNode
        ) {
            this.emitMutation({
                focusedListRenderedId: { $set: baseUnifiedId },
                listIdsShownAsTrees: {
                    $apply: (ids: string[]) =>
                        ids.filter((id) => id !== baseUnifiedId),
                },
            })
        }
    }

    private async handleEnterKeyPress(
        state: SpacePickerState,
        isCmdKey?: boolean,
    ) {
        if (state.newEntryName != null && isCmdKey) {
            await this._pressNewEntry(state)
        } else if (state.focusedListRenderedId != null) {
            let {
                baseUnifiedId,
                treeNodeUnifiedId,
            } = extractUnifiedIdsFromRenderedId(state.focusedListRenderedId)
            let unifiedId = treeNodeUnifiedId ?? baseUnifiedId
            let localListId = state.listEntries.byId[unifiedId]?.localId
            if (localListId == null) {
                return
            }
            await this._pressEntry(localListId, state)
        }
    }

    private handleMouseOver = () => {
        this.emitMutation({ blockMouseOver: { $set: false } })
        document.removeEventListener('mousemove', this.handleMouseOver)
    }

    keyPress: EventHandler<'keyPress'> = async ({
        event: { event },
        previousState,
    }) => {
        if (event.key === 'Enter') {
            const isCmdKey = event.metaKey || event.ctrlKey
            await this.handleEnterKeyPress(previousState, isCmdKey)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            let focusedListId = this.calcNextFocusedEntry(previousState, -1)
            this.dependencies.getEntryRowRefs()[focusedListId]?.scrollIntoView()
            this.emitMutation({ blockMouseOver: { $set: true } })
            document.addEventListener('mousemove', this.handleMouseOver)
            return
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            let focusedListId = this.calcNextFocusedEntry(previousState, 1)
            this.dependencies.getEntryRowRefs()[focusedListId]?.scrollIntoView()
            this.emitMutation({ blockMouseOver: { $set: true } })
            document.addEventListener('mousemove', this.handleMouseOver)
            return
        }

        if (
            (event.key === 'ArrowRight' || event.key === 'ArrowLeft') &&
            previousState.focusedListRenderedId != null
        ) {
            await this.handleLeftRightArrowKeyPress(previousState, event.key)
            return
        }

        if (event.key === 'Escape') {
            this.dependencies.closePicker(event)
            return
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
        })

        if (previousState.query.trim() === query.trim()) {
            return
        }

        if (query.trim().length === 0) {
            this.emitMutation({
                newEntryName: { $set: null },
                query: { $set: '' },
                filteredListIds: { $set: null },
            })
            return
        }
        let isPathSearch = false
        let pathSearchItems: string[] = []
        if (query.includes('/')) {
            isPathSearch = true
        }
        if (isPathSearch) {
            pathSearchItems = query.split('/')
        } else {
            pathSearchItems = [query]
        }

        const entireListEntryPool = [
            ...normalizedStateToArray(previousState.listEntries),
            ...normalizedStateToArray(previousState.pageLinkEntries),
        ]

        let newEntryObject: { unifiedId: string; name: string }[] =
            previousState.newEntryName ?? []
        let queryForNewSpaces = pathSearchItems[pathSearchItems.length - 1]

        const distinctTerms = queryForNewSpaces.split(/\s+/).filter(Boolean)
        const doAllTermsMatch = (list: UnifiedList): boolean =>
            distinctTerms.reduce((acc, term) => {
                const matches =
                    acc &&
                    list.name
                        .toLocaleLowerCase()
                        .includes(term.toLocaleLowerCase())

                return matches
            }, true)

        let lastSelectedId = extractUnifiedIdsFromRenderedId(
            previousState.focusedListRenderedId,
        ).baseUnifiedId
        if (query.endsWith('/')) {
            const isBackspaced = query.length < previousState.query.length
            let lastSpaceName = null
            let updatedQuery = query

            if (!isBackspaced) {
                let path =
                    previousState.listEntries?.byId[lastSelectedId]
                        ?.pathUnifiedIds
                lastSpaceName =
                    previousState.listEntries?.byId[lastSelectedId]?.name
                // checks if the last item in teh path is a null on the unifiedId to detect if the next item should be appended appended without clearning the object list
                const isMultiplePathAdditions =
                    newEntryObject[newEntryObject.length - 1]?.unifiedId ===
                    null
                if (
                    (!isMultiplePathAdditions || newEntryObject.length === 0) &&
                    query.includes('/')
                ) {
                    if (path.length > 0) {
                        newEntryObject = []
                        updatedQuery = ''
                        for (let unifiedId of path) {
                            const list = this.dependencies.annotationsCache
                                .lists.byId[unifiedId]
                            const name = list.name
                            newEntryObject.push({
                                unifiedId: unifiedId,
                                name: name,
                            })

                            updatedQuery += `${name}/`
                        }
                    }

                    newEntryObject.push({
                        unifiedId: lastSelectedId,
                        name: lastSpaceName,
                    })
                    updatedQuery += `${lastSpaceName}/`
                } else if (!query.includes('/')) {
                    newEntryObject.push({
                        unifiedId: lastSelectedId,
                        name: lastSpaceName,
                    })
                    updatedQuery = `${lastSpaceName}/`
                }
            } else {
                newEntryObject.pop()
                newEntryObject.push({
                    unifiedId: null,
                    name: '',
                })
            }

            this.emitMutation({
                query: { $set: updatedQuery },
                listIdsShownAsTrees: {
                    $apply: (prev) =>
                        prev.includes(lastSelectedId)
                            ? prev
                            : [...prev, lastSelectedId],
                },
            })
        } else if (query.includes('/') && !query.endsWith('/')) {
            const lastNonNullUnifiedIdEntry = newEntryObject
                .slice()
                .reverse()
                .find((entry) => entry.unifiedId !== null)
            lastSelectedId = lastNonNullUnifiedIdEntry?.unifiedId

            if (queryForNewSpaces.length > 1) {
                newEntryObject.pop()
            }

            newEntryObject.push({
                unifiedId: null,
                name: queryForNewSpaces,
            })
        }

        this.emitMutation({ newEntryName: { $set: newEntryObject } })

        let filteredEntries: UnifiedList[] = []
        if (pathSearchItems.length === 1) {
            filteredEntries = entireListEntryPool.filter(doAllTermsMatch)
        } else {
            const children = this.dependencies.annotationsCache.getListsByParentId(
                lastSelectedId,
            )
            filteredEntries = children.filter(doAllTermsMatch)
            if (
                filteredEntries.length === 0 &&
                queryForNewSpaces.length === 0
            ) {
                filteredEntries = children
            }
        }

        let matchingEntryIds = filteredEntries.flatMap((entry) => [
            entry.unifiedId,
            // ...entry.pathUnifiedIds,
        ])

        if (pathSearchItems.length > 1 && filteredEntries.length === 0) {
            const lastNonNullUnifiedIdEntry = newEntryObject
                .slice()
                .reverse()
                .find((entry) => entry.unifiedId !== null)
            lastSelectedId = lastNonNullUnifiedIdEntry?.unifiedId

            const pathOfLastEntry = [lastSelectedId]
            matchingEntryIds = pathOfLastEntry
        }

        lastSelectedId =
            matchingEntryIds[0] ?? previousState.focusedListRenderedId
        const mutation: UIMutation<SpacePickerState> = {
            filteredListIds: { $set: matchingEntryIds },
            focusedListRenderedId: { $set: lastSelectedId },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)
        // added this to give the focus function a specific ID to focus on specific item id
        if (matchingEntryIds && matchingEntryIds.length > 0) {
            let listIdToFocusFirst = matchingEntryIds[0]
            this.emitMutation({ newEntryName: { $set: newEntryObject } })

            if (filteredEntries.length === 0 && queryForNewSpaces.length > 0) {
                listIdToFocusFirst = '-1'
            }
            this.calcNextFocusedEntry(nextState, null, listIdToFocusFirst)
        } else {
            if (newEntryObject[newEntryObject.length - 1]?.unifiedId == null) {
                newEntryObject.pop()
            }
            const queryParts = query.split('/').pop()
            newEntryObject.push({ unifiedId: null, name: queryParts })
        }

        if (previousState.query.length > 0 && nextState.query.length === 0) {
            this.emitMutation({
                newEntryName: { $set: null },
                query: { $set: '' },
            })
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

            const listIdToFocusFirst = toSet.byId[0].unifiedId
            const nextState = this.withMutation(previousState, mutation)
            this.calcNextFocusedEntry(nextState, null, listIdToFocusFirst)
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
            this.calcNextFocusedEntry(state)
            return
        }

        if (state.query.length > 0) {
            const { valid } = this.validateSpaceName(_input)
            if (!valid) {
                return
            }
        }

        // this.emitMutation({ newEntryName: { $set: _input } })
        this.calcNextFocusedEntry(state)
    }

    convertQueryIntoEntryNameObject = (query: string) => {
        const queryParts = query.split('/')
    }

    pressEntry: EventHandler<'pressEntry'> = async ({
        event,
        previousState,
    }) => {
        await this._pressEntry(event.entry.localId, previousState)
    }

    private async _pressEntry(
        localListId: number,
        previousState: SpacePickerState,
    ) {
        let nextState: SpacePickerState
        const listData = __getListDataByLocalId(
            localListId,
            this.dependencies,
            { source: 'pressEntry' },
        )

        await executeUITask(this, 'spaceAddRemoveState', async () => {
            try {
                let entrySelectPromise: Promise<void | boolean> | void
                // If we're going to unselect it
                if (previousState.selectedListIds.includes(localListId)) {
                    this.selectedListIds = previousState.selectedListIds.filter(
                        (id) => id !== localListId,
                    )

                    entrySelectPromise = this.dependencies.unselectEntry(
                        localListId,
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
                        localListId,
                    )
                }

                nextState = this.applyAndEmitMutation(previousState, {
                    selectedListIds: { $set: this.selectedListIds },
                })

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
        parentList: UnifiedList['localId'] = null,
        skipSelecting: boolean = false,
    ): Promise<number> {
        if (this.dependencies.filterMode) {
            return
        }
        let parentPath = null
        if (parentList != null) {
            parentPath = this.dependencies.annotationsCache.getListByLocalId(
                parentList,
            )?.pathLocalIds
        }
        const {
            collabKey,
            localListId,
            remoteListId,
        } = await this.dependencies.spacesBG.createCustomList({
            name,
            parentListId: parentList,
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
            parentLocalId: parentList,
            isPrivate: true,
            pathLocalIds: parentPath ? [...parentPath, parentList] : [],
        })

        this.localListIdsMRU.unshift(localListId)
        if (!skipSelecting) {
            this.selectedListIds.unshift(localListId)
            this.dependencies.onSpaceCreate?.({
                name,
                localListId,
                collabKey,
                remoteListId,
            })
        }

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
            newEntryName: { $set: [] },
        })

        const mutation: UIMutation<SpacePickerState> = {
            selectedListIds: { $set: this.selectedListIds },
            filteredListIds: { $set: null },
            listEntries: { $set: toSet },
        }

        this.emitMutation(mutation)
        const nextState = this.withMutation(previousState, mutation)

        this.calcNextFocusedEntry(nextState)

        return localListId
    }

    setSpaceWriteError: EventHandler<'setSpaceWriteError'> = async ({
        event,
    }) => {
        this.emitMutation({
            spaceWriteError: { $set: event.error },
        })
    }

    pressNewEntry: EventHandler<'pressNewEntry'> = async ({
        previousState,
    }) => {
        await this._pressNewEntry(previousState)
    }

    private async _pressNewEntry(previousState: SpacePickerState) {
        let entry = previousState.newEntryName
        await executeUITask(this, 'spaceCreateState', async () => {
            // NOTE: This is here as the enter press event from the context menu to confirm a space rename
            //   was also bubbling up into the space menu and being interpretted as a new space confirmation.
            //   Resulting in both a new space create + existing space rename. This is a hack to prevent that.
            if (previousState.contextMenuListId != null) {
                return
            }

            let parentLocalId: number = null

            for (let i = 0; i < entry.length; i++) {
                const item = entry[i]
                if (item.unifiedId == null) {
                    try {
                        parentLocalId = this.dependencies.annotationsCache.lists
                            .byId[entry[i - 1]?.unifiedId]?.localId
                        const listId = await this.createAndDisplayNewList(
                            item.name,
                            previousState,
                            parentLocalId,
                            i === entry.length - 1 ? false : true,
                        )

                        const newListUnifiedId = this.dependencies.annotationsCache.getListByLocalId(
                            listId,
                        )?.unifiedId

                        let listTreesRef = this.dependencies.getListTreeRefs()

                        listTreesRef[newListUnifiedId]?.processEvent(
                            'toggleShowChildren',
                            {
                                listId: newListUnifiedId,
                            },
                        )
                    } catch (err) {
                        this.emitMutation({
                            spaceWriteError: { $set: err.message },
                        })
                        throw err
                    }
                }
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

    focusListEntry: EventHandler<'focusListEntry'> = ({ event }) => {
        this.emitMutation({
            focusedListRenderedId: { $set: event.listRenderedId },
        })
    }
}

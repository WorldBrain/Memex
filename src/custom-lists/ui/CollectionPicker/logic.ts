import debounce from 'lodash/debounce'
import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { KeyEvent, DisplayEntry } from 'src/common-ui/GenericPicker/types'
import type {
    RemoteCollectionsInterface,
    PageList,
} from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { validateSpaceName } from '@worldbrain/memex-common/lib/utils/space-name-validation'

export interface SpaceDisplayEntry {
    localId: number
    remoteId: string | null
    name: string
    createdAt: number
    focused: boolean
}

export interface SpacePickerDependencies {
    createNewEntry: (name: string) => Promise<number>
    selectEntry: (
        listId: number,
        options?: { protectAnnotation?: boolean },
    ) => Promise<void>
    unselectEntry: (listId: number) => Promise<void>
    actOnAllTabs?: (listId: number) => Promise<void>
    onEscapeKeyDown?: () => void | Promise<void>
    /** Called when user keys Enter+Cmd/Ctrl in main text input */
    onSubmit?: () => void | Promise<void>
    initialSelectedEntries?: () => number[] | Promise<number[]>
    children?: any
    filterMode?: boolean
    removeTooltipText?: string
    searchInputPlaceholder?: string
    onClickOutside?: React.MouseEventHandler
    spacesBG: RemoteCollectionsInterface
    contentSharingBG: ContentSharingInterface
}

// TODO: This needs cleanup - so inconsistent
export type SpacePickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    searchInputChanged: { query: string }
    selectedEntryPress: { entry: number }
    resultEntryAllPress: { entry: SpaceDisplayEntry }
    newEntryAllPress: { entry: string }
    resultEntryPress: { entry: SpaceDisplayEntry }
    resultEntryFocus: { entry: SpaceDisplayEntry; index: number }
    setListRemoteId: { localListId: number; remoteListId: string }
    toggleEntryContextMenu: { listId: number }
    updateContextMenuPosition: { x?: number; y?: number }
    validateSpaceName: { listId: number; name: string }
    renameList: { listId: number; name: string }
    deleteList: { listId: number }
    newEntryPress: { entry: string }
    keyPress: { event: KeyboardEvent }
    focusInput: {}
}>

type EventHandler<EventName extends keyof SpacePickerEvent> = UIEventHandler<
    SpacePickerState,
    SpacePickerEvent,
    EventName
>

export interface SpacePickerState {
    query?: string
    newEntryName: string
    displayEntries: SpaceDisplayEntry[]
    selectedEntries: number[]
    contextMenuPositionX: number
    contextMenuPositionY: number
    contextMenuListId: number | null
    loadState: TaskState
    loadingSuggestions: TaskState
    loadingShareStates: TaskState
    loadingQueryResults: TaskState
    renameListErrorMessage: string | null
}

const sortDisplayEntries = (selectedEntries: number[]) => (
    a: SpaceDisplayEntry,
    b: SpaceDisplayEntry,
): number =>
    (selectedEntries.includes(b.localId) ? 1 : 0) -
    (selectedEntries.includes(a.localId) ? 1 : 0)

export default class SpacePickerLogic extends UILogic<
    SpacePickerState,
    SpacePickerEvent
> {
    private searchInputRef?: HTMLInputElement
    private newTabKeys: KeyEvent[] = ['Enter', ',', 'Tab']

    constructor(protected dependencies: SpacePickerDependencies) {
        super()
    }

    public defaultEntries: SpaceDisplayEntry[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>

    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

    getInitialState = (): SpacePickerState => ({
        query: '',
        newEntryName: '',
        displayEntries: [],
        selectedEntries: [],
        loadState: 'pristine',
        loadingSuggestions: 'pristine',
        loadingShareStates: 'pristine',
        loadingQueryResults: 'pristine',
        renameListErrorMessage: null,
        contextMenuListId: null,
        contextMenuPositionX: 0,
        contextMenuPositionY: 0,
    })

    init: EventHandler<'init'> = async () => {
        const {
            spacesBG,
            contentSharingBG,
            initialSelectedEntries,
        } = this.dependencies

        await loadInitial(this, async () => {
            await executeUITask(this, 'loadingSuggestions', async () => {
                const [selectedEntries, initSuggestions] = await Promise.all([
                    initialSelectedEntries ? initialSelectedEntries() : [],
                    spacesBG.fetchInitialListSuggestions(),
                ])

                this.defaultEntries = initSuggestions.sort(
                    sortDisplayEntries(selectedEntries),
                )

                this.emitMutation({
                    selectedEntries: { $set: selectedEntries },
                    displayEntries: { $set: this.defaultEntries },
                })
            })

            await executeUITask(this, 'loadingShareStates', async () => {
                const localToRemoteIdDict = await contentSharingBG.getRemoteListIds(
                    {
                        localListIds: this.defaultEntries.map(
                            (s) => s.localId as number,
                        ),
                    },
                )
                this.defaultEntries = this.defaultEntries.map((s) => ({
                    ...s,
                    remoteId: localToRemoteIdDict[s.localId] ?? null,
                }))
                this.emitMutation({
                    displayEntries: { $set: this.defaultEntries },
                })
            })
        })
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

    keyPress: EventHandler<'keyPress'> = async ({
        event: { event },
        previousState,
    }) => {
        if (
            event.key === 'Enter' &&
            event.metaKey &&
            this.dependencies.onSubmit
        ) {
            await this.dependencies.onSubmit()
            return
        }

        if (this.newTabKeys.includes(event.key as KeyEvent)) {
            if (previousState.newEntryName !== '' && !(this.focusIndex >= 0)) {
                await this.newEntryPress({
                    previousState,
                    event: { entry: previousState.newEntryName },
                })
                return
            }

            if (previousState.displayEntries[this.focusIndex]) {
                await this.resultEntryPress({
                    event: {
                        entry: previousState.displayEntries[this.focusIndex],
                    },
                    previousState,
                })
                return
            }
        }

        if (event.key === 'ArrowUp') {
            if (this.focusIndex > -1) {
                this._updateFocus(
                    --this.focusIndex,
                    previousState.displayEntries,
                )
                return
            }
        }

        if (event.key === 'ArrowDown') {
            if (this.focusIndex < previousState.displayEntries.length - 1) {
                this._updateFocus(
                    ++this.focusIndex,
                    previousState.displayEntries,
                )
                return
            }
        }

        if (event.key === 'Escape' && this.dependencies.onEscapeKeyDown) {
            await this.dependencies.onEscapeKeyDown()
            return
        }
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

    updateContextMenuPosition: EventHandler<
        'updateContextMenuPosition'
    > = async ({ event, previousState }) => {
        this.emitMutation({
            contextMenuPositionX: {
                $set:
                    event.x != null
                        ? event.x
                        : previousState.contextMenuPositionX,
            },
            contextMenuPositionY: {
                $set:
                    event.y != null
                        ? event.y
                        : previousState.contextMenuPositionY,
            },
        })
    }

    setListRemoteId: EventHandler<'setListRemoteId'> = async ({
        event,
        previousState,
    }) => {
        const stateEntryIndex = previousState.displayEntries.findIndex(
            (entry) => entry.localId === event.localListId,
        )
        const defaultEntryIndex = this.defaultEntries.findIndex(
            (entry) => entry.localId === event.localListId,
        )

        if (stateEntryIndex === -1 || defaultEntryIndex === -1) {
            throw new Error('Canot set remote id for list that is not tracked')
        }

        this.defaultEntries[defaultEntryIndex].remoteId = event.remoteListId

        this.emitMutation({
            displayEntries: {
                [stateEntryIndex]: {
                    remoteId: { $set: event.remoteListId },
                },
            },
        })
    }

    private _validateSpaceName(listId: number, name: string): boolean {
        const validationResult = validateSpaceName(
            name,
            this.defaultEntries.map((entry) => ({
                id: entry.localId,
                name: entry.name,
            })),
            { listIdToSkip: listId },
        )

        this.emitMutation({
            renameListErrorMessage: {
                $set:
                    validationResult.valid === false
                        ? validationResult.reason
                        : null,
            },
        })

        return validationResult.valid
    }

    validateSpaceName: EventHandler<'validateSpaceName'> = async ({
        event,
    }) => {
        this._validateSpaceName(event.listId, event.name)
    }

    renameList: EventHandler<'renameList'> = async ({
        event,
        previousState,
    }) => {
        if (!this._validateSpaceName(event.listId, event.name)) {
            return
        }

        const stateEntryIndex = previousState.displayEntries.findIndex(
            (entry) => entry.localId === event.listId,
        )
        const defaultEntryIndex = this.defaultEntries.findIndex(
            (entry) => entry.localId === event.listId,
        )

        if (previousState.displayEntries[stateEntryIndex].name === event.name) {
            return
        }

        const validationResult = validateSpaceName(
            event.name,
            this.defaultEntries.map((entry) => ({
                id: entry.localId,
                name: entry.name,
            })),
            { listIdToSkip: event.listId },
        )

        if (validationResult.valid === false) {
            this.emitMutation({
                renameListErrorMessage: {
                    $set: validationResult.reason,
                },
            })
            return
        }

        if (stateEntryIndex !== -1) {
            this.emitMutation({
                displayEntries: {
                    [stateEntryIndex]: { name: { $set: event.name } },
                },
                renameListErrorMessage: { $set: null },
            })
        }

        if (defaultEntryIndex !== -1) {
            this.defaultEntries = [
                ...this.defaultEntries.slice(0, defaultEntryIndex),
                {
                    ...this.defaultEntries[defaultEntryIndex],
                    name: event.name,
                },
                ...this.defaultEntries.slice(defaultEntryIndex + 1),
            ]
        }

        await this.dependencies.spacesBG.updateListName({
            id: event.listId,
            newName: event.name,
            oldName: previousState.displayEntries[stateEntryIndex].name,
        })
    }

    deleteList: EventHandler<'deleteList'> = async ({
        event,
        previousState,
    }) => {
        const stateEntryIndex = previousState.displayEntries.findIndex(
            (entry) => entry.localId === event.listId,
        )
        const defaultEntryIndex = this.defaultEntries.findIndex(
            (entry) => entry.localId === event.listId,
        )

        if (stateEntryIndex !== -1) {
            this.emitMutation({
                displayEntries: {
                    $apply: (entries) =>
                        entries.filter((e) => e.localId !== event.listId),
                },
            })
        }

        if (defaultEntryIndex !== -1) {
            this.defaultEntries = [
                ...this.defaultEntries.slice(0, defaultEntryIndex),
                ...this.defaultEntries.slice(defaultEntryIndex + 1),
            ]
        }
        await this.dependencies.spacesBG.removeList({ id: event.listId })
    }

    searchInputChanged: EventHandler<'searchInputChanged'> = async ({
        event: { query },
        previousState,
    }) => {
        this.emitMutation({
            query: { $set: query },
            newEntryName: { $set: query },
        })

        if (!query || query === '') {
            this.emitMutation({ displayEntries: { $set: this.defaultEntries } })
        } else {
            return this.query(query, previousState)
        }
    }

    /**
     * Searches for the term via the `queryEntries` function provided to the component
     */
    private queryRemote = async (
        term: string,
        { selectedEntries }: SpacePickerState,
    ) => {
        const { spacesBG, contentSharingBG } = this.dependencies

        await executeUITask(this, 'loadingQueryResults', async () => {
            const suggestions = await spacesBG.searchForListSuggestions({
                query: term.toLocaleLowerCase(),
            })
            const remoteListIds = await contentSharingBG.getRemoteListIds({
                localListIds: suggestions.map((s) => s.id),
            })
            const displayEntries: SpaceDisplayEntry[] = suggestions
                .map((s) => {
                    const remoteId = remoteListIds[s.id] ?? null
                    return {
                        remoteId,
                        name: s.name,
                        localId: s.id,
                        focused: false,
                        createdAt: s.createdAt,
                    }
                })
                .sort(sortDisplayEntries(selectedEntries))

            this.emitMutation({ displayEntries: { $set: displayEntries } })
            this._setCreateEntryDisplay(displayEntries, term)
        })
    }

    private query = debounce(this.queryRemote, 150, { leading: true })

    /**
     * If the term provided does not exist in the entry list, then set the new entry state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    private _setCreateEntryDisplay = (
        displayEntries: SpaceDisplayEntry[],
        term: string,
    ) => {
        if (this._isTermInEntryList(displayEntries, term)) {
            this.emitMutation({ newEntryName: { $set: '' } })
            // N.B. We update this focus index to this found entry, so that
            // enter keys will action it. But we don't emit that focus
            // to the user, because otherwise the style of the button changes
            // showing the tick and it might seem like it's already selected.
            this._updateFocus(0, displayEntries, false)
        } else {
            let entry: string
            try {
                entry = this.validateEntry(term)
            } catch (e) {
                return
            }
            this.emitMutation({ newEntryName: { $set: entry } })
            this._updateFocus(-1, displayEntries)
        }
    }

    private _updateFocus = (
        focusIndex: number | undefined,
        displayEntries: SpaceDisplayEntry[],
        emit = true,
    ) => {
        this.focusIndex = focusIndex ?? -1
        if (!displayEntries) {
            return
        }

        for (let i = 0; i < displayEntries.length; i++) {
            displayEntries[i].focused = focusIndex === i
        }

        if (emit) {
            this.emitMutation({ displayEntries: { $set: displayEntries } })
        }
    }

    /**
     * Loops through a list of entries and exits if a match is found
     */
    private _isTermInEntryList = (
        entryList: SpaceDisplayEntry[],
        term: string,
    ) => {
        for (const entry of entryList) {
            if (entry.name === term) {
                return true
            }
        }
        return false
    }

    selectedEntryPress: EventHandler<'selectedEntryPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        this.emitMutation({
            selectedEntries: {
                $set: previousState.selectedEntries.filter(
                    (id) => id !== entry,
                ),
            },
        } as UIMutation<SpacePickerState>)

        await this.dependencies.unselectEntry(entry)
    }

    resultEntryPress: EventHandler<'resultEntryPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        const { unselectEntry, selectEntry } = this.dependencies
        let nextState: SpacePickerState

        // If we're going to unselect it
        if (previousState.selectedEntries.includes(entry.localId)) {
            const mutation: UIMutation<SpacePickerState> = {
                selectedEntries: {
                    $set: previousState.selectedEntries.filter(
                        (id) => id !== entry.localId,
                    ),
                },
            }

            this.emitMutation(mutation)
            nextState = this.withMutation(previousState, mutation)

            await unselectEntry(entry.localId)
        } else {
            const prevDisplayEntriesIndex = previousState.displayEntries.findIndex(
                ({ localId }) => localId === entry.localId,
            )
            const prevDefaultEntriesIndex = this.defaultEntries.findIndex(
                ({ localId }) => localId === entry.localId,
            )

            const mutation: UIMutation<SpacePickerState> = {
                selectedEntries: { $push: [entry.localId] },
                displayEntries: {
                    // Reposition selected entry at start of display list
                    $set: [
                        previousState.displayEntries[prevDisplayEntriesIndex],
                        ...previousState.displayEntries.slice(
                            0,
                            prevDisplayEntriesIndex,
                        ),
                        ...previousState.displayEntries.slice(
                            prevDisplayEntriesIndex + 1,
                        ),
                    ],
                },
            }

            this.emitMutation(mutation)
            nextState = this.withMutation(previousState, mutation)

            // `defaultEntries` is initially only populated with what it gets from suggestions cache. If a search happens
            //   and an entry which isn't one of the initial suggestions is pressed, then we need to add it to `defaultEntries`
            if (prevDefaultEntriesIndex !== -1) {
                this.defaultEntries = [
                    this.defaultEntries[prevDefaultEntriesIndex],
                    ...this.defaultEntries.slice(0, prevDefaultEntriesIndex),
                    ...this.defaultEntries.slice(prevDefaultEntriesIndex + 1),
                ]
            } else {
                this.defaultEntries = [
                    {
                        ...previousState.displayEntries[
                            prevDisplayEntriesIndex
                        ],
                    },
                    ...this.defaultEntries,
                ]
            }

            await selectEntry(entry.localId)
        }

        await this.searchInputChanged({
            event: { query: '' },
            previousState: nextState,
        })
    }

    resultEntryAllPress: EventHandler<'resultEntryAllPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(
            entry.localId,
        )

        const isAlreadySelected = previousState.selectedEntries.includes(
            entry.localId,
        )

        this.emitMutation({
            selectedEntries: {
                $set: isAlreadySelected
                    ? previousState.selectedEntries.filter(
                          (entryId) => entryId !== entry.localId,
                      )
                    : [...previousState.selectedEntries, entry.localId],
            },
        } as UIMutation<SpacePickerState>)
    }

    private async createAndDisplayNewList(name: string): Promise<number> {
        const newId = await this.dependencies.createNewEntry(name)
        const newEntry: SpaceDisplayEntry = {
            name,
            localId: newId,
            focused: false,
            remoteId: null,
            createdAt: Date.now(),
        }
        this.defaultEntries.unshift(newEntry)
        this.emitMutation({
            query: { $set: '' },
            newEntryName: { $set: '' },
            selectedEntries: { $push: [newId] },
            displayEntries: {
                $set: [...this.defaultEntries],
            },
        } as UIMutation<SpacePickerState>)
        return newId
    }

    newEntryPress: EventHandler<'newEntryPress'> = async ({
        event: { entry },
    }) => {
        entry = this.validateEntry(entry)
        const listId = await this.createAndDisplayNewList(entry)
        await this.dependencies.selectEntry(listId)
    }

    newEntryAllPress: EventHandler<'newEntryAllPress'> = async ({
        event: { entry },
    }) => {
        const newId = await this.createAndDisplayNewList(entry)
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(
            newId,
        )
    }

    resultEntryFocus: EventHandler<'resultEntryFocus'> = ({
        event: { entry, index },
        previousState,
    }) => {
        this._updateFocus(index, previousState.displayEntries)
    }

    validateEntry = (entry: string) => {
        const validationResult = validateSpaceName(
            entry,
            this.defaultEntries.map((e) => ({ id: e.localId, name: e.name })),
        )

        if (validationResult.valid === false) {
            throw Error('Space Picker Validation: ' + validationResult.reason)
        }

        return entry
    }
}

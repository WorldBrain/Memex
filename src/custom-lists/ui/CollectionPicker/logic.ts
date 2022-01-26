import debounce from 'lodash/debounce'
import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import type { KeyEvent } from 'src/common-ui/GenericPicker/types'

export interface SpaceDisplayEntry {
    localId: number
    remoteId: string | number | null
    name: string
    focused: boolean
    createdAt: number
}

export interface SpacePickerDependencies {
    createNewEntry: (name: string) => Promise<number>
    selectEntry: (listId: number) => Promise<void>
    unselectEntry: (listId: number) => Promise<void>
    queryEntries: (query: string) => Promise<SpaceDisplayEntry[]>
    actOnAllTabs?: (listId: number) => Promise<void>
    onEscapeKeyDown?: () => void | Promise<void>
    loadDefaultSuggestions: (args?: {
        limit?: number
    }) => SpaceDisplayEntry[] | Promise<SpaceDisplayEntry[]>
    initialSelectedEntries?: () => number[] | Promise<number[]>
    children?: any
    onClickOutside?: React.MouseEventHandler
}

export type SpacePickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    searchInputChanged: { query: string }
    selectedEntryPress: { entry: number }
    resultEntryAllPress: { entry: SpaceDisplayEntry }
    newEntryAllPress: { entry: string }
    resultEntryPress: { entry: SpaceDisplayEntry }
    resultEntryFocus: { entry: SpaceDisplayEntry; index: number }
    newEntryPress: { entry: string }
    keyPress: { key: KeyEvent }
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
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export default class SpacePickerLogic extends UILogic<
    SpacePickerState,
    SpacePickerEvent
> {
    private searchInputRef?: HTMLInputElement
    private newTabKeys: KeyEvent[] = ['Enter', ',', 'Tab']

    constructor(protected dependencies: SpacePickerDependencies) {
        super()
    }

    protected defaultEntries: SpaceDisplayEntry[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>
    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

    getInitialState(): SpacePickerState {
        return {
            query: '',
            newEntryName: '',
            displayEntries: [],
            selectedEntries: [],
            loadingSuggestions: false,
            loadingQueryResults: false,
        } as SpacePickerState
    }

    init: EventHandler<'init'> = async () => {
        this.emitMutation({
            $apply: (state) => ({ ...state, loadingSuggestions: true }),
        })

        const initialSelectedEntries = this.dependencies.initialSelectedEntries
            ? await this.dependencies.initialSelectedEntries()
            : []

        const defaultSuggestions =
            typeof this.dependencies.loadDefaultSuggestions === 'string'
                ? this.dependencies.loadDefaultSuggestions
                : await this.dependencies.loadDefaultSuggestions()

        this.defaultEntries = defaultSuggestions

        this.emitMutation({
            $apply: (state) => ({
                ...state,
                loadingSuggestions: false,
                displayEntries: this.defaultEntries,
                selectedEntries: initialSelectedEntries,
            }),
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

    keyPress: EventHandler<'keyPress'> = ({
        event: { key },
        previousState,
    }) => {
        if (this.newTabKeys.includes(key)) {
            if (previousState.newEntryName !== '' && !(this.focusIndex >= 0)) {
                return this.newEntryPress({
                    previousState,
                    event: { entry: previousState.newEntryName },
                })
            }

            if (previousState.displayEntries[this.focusIndex]) {
                return this.resultEntryPress({
                    event: {
                        entry: previousState.displayEntries[this.focusIndex],
                    },
                    previousState,
                })
            }
        }

        if (key === 'ArrowUp') {
            if (this.focusIndex > -1) {
                return this._updateFocus(
                    --this.focusIndex,
                    previousState.displayEntries,
                )
            }
        }

        if (key === 'ArrowDown') {
            if (this.focusIndex < previousState.displayEntries.length - 1) {
                return this._updateFocus(
                    ++this.focusIndex,
                    previousState.displayEntries,
                )
            }
        }

        if (key === 'Escape' && this.dependencies.onEscapeKeyDown) {
            return this.dependencies.onEscapeKeyDown()
        }
    }

    searchInputChanged: EventHandler<'searchInputChanged'> = async ({
        event: { query },
        previousState,
    }) => {
        this.emitMutation({
            $apply: (state) => ({
                ...state,
                query,
                newEntryName: query,
            }),
        })

        if (!query || query === '') {
            this.emitMutation({
                $apply: (state) => ({
                    ...state,
                    displayEntries: this.defaultEntries,
                    newEntryName: '',
                    query: '',
                }),
            })
        } else {
            return this._query(query, previousState.selectedEntries)
        }
    }

    /**
     * Searches for the term via the `queryEntries` function provided to the component
     */
    private _queryRemote = async (
        term: string,
        selectedEntries: Array<string | number>,
    ) => {
        this.emitMutation({
            $apply: (state) => ({ ...state, loadingQueryResults: true }),
        })
        const displayEntries = await this.dependencies.queryEntries(
            term.toLocaleLowerCase(),
        )
        displayEntries.sort()
        this.emitMutation({
            $apply: (state) => ({
                ...state,
                loadingQueryResults: false,
                displayEntries,
            }),
        })
        this._setCreateEntryDisplay(displayEntries, displayEntries, term)
    }

    private _query = debounce(this._queryRemote, 150, { leading: true })

    /**
     * If the term provided does not exist in the entry list, then set the new entry state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    private _setCreateEntryDisplay = (
        list: SpaceDisplayEntry[],
        displayEntries: SpaceDisplayEntry[],
        term: string,
    ) => {
        if (this._isTermInEntryList(list, term)) {
            this.emitMutation({
                $apply: (state) => ({
                    ...state,
                    newEntryName: '',
                }),
            })
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
            this.emitMutation({
                $apply: (state) => ({
                    ...state,
                    newEntryName: entry,
                }),
            })
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

        emit &&
            this.emitMutation({
                $apply: (state) => ({
                    ...state,
                    displayEntries,
                }),
            })
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

        if (previousState.selectedEntries.includes(entry.localId)) {
            this.emitMutation({
                selectedEntries: {
                    $set: previousState.selectedEntries.filter(
                        (id) => id !== entry.localId,
                    ),
                },
            } as UIMutation<SpacePickerState>)
            await unselectEntry(entry.localId)
        } else {
            this.emitMutation({
                selectedEntries: { $push: [entry.localId] },
            } as UIMutation<SpacePickerState>)
            await selectEntry(entry.localId)
        }
    }

    resultEntryAllPress: EventHandler<'resultEntryAllPress'> = async ({
        event: { entry },
        previousState,
    }) => {
        this.validateEntry(entry.name)
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
        this.emitMutation({
            query: { $set: '' },
            newEntryName: { $set: '' },
            selectedEntries: { $push: [newId] },
            displayEntries: {
                $set: [
                    ...this.defaultEntries,
                    { localId: newId, focused: false, name },
                ],
            },
        } as UIMutation<SpacePickerState>)
        return newId
    }

    newEntryPress: EventHandler<'newEntryPress'> = async ({
        event: { entry },
    }) => {
        entry = this.validateEntry(entry)
        await this.createAndDisplayNewList(entry)
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
        entry = entry.trim()

        if (entry === '') {
            throw Error(
                `Space Picker Validation: Can't add entry with only whitespace`,
            )
        }

        return entry
    }
}

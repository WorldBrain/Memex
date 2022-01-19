import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'

import { KeyEvent, DisplayEntry, PickerUpdateHandler } from './types'

export interface GenericPickerState<
    EntryType extends DisplayEntry = DisplayEntry
> {
    query?: string
    newEntryName: string
    displayEntries: EntryType[]
    selectedEntries: Array<string | number>
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export interface GenericPickerDependencies<
    EntryType extends DisplayEntry = DisplayEntry
> {
    selectIdField: (entry: EntryType) => string | number
    selectDisplayField: (entry: EntryType) => string
    onUpdateEntrySelection: PickerUpdateHandler
    queryEntries: (query: string) => Promise<EntryType[]>
    actOnAllTabs?: (query: string) => Promise<void>
    onEscapeKeyDown?: () => void | Promise<void>
    loadDefaultSuggestions: () => EntryType[] | Promise<EntryType[]>
    initialSelectedEntries?: () =>
        | Array<number | string>
        | Promise<Array<number | string>>
    children?: any
}

export type GenericPickerDependenciesMinusSave<
    EntryType extends DisplayEntry = DisplayEntry
> = Omit<GenericPickerDependencies<EntryType>, 'onUpdateEntrySelection'>

export type GenericPickerEvent<
    EntryType extends DisplayEntry = DisplayEntry
> = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    loadedSuggestions: {}
    loadedQueryResults: {}
    entryClicked: {}
    searchInputChanged: { query: string }
    selectedEntryPress: { entry: string }
    resultEntryAllPress: { entry: EntryType }
    newEntryAllPress: { entry: string }
    resultEntryPress: { entry: EntryType }
    resultEntryFocus: { entry: EntryType; index: number }
    newEntryPress: { entry: string }
    keyPress: { key: KeyEvent }
    focusInput: {}
}>

interface GenericPickerUIEvent<
    T extends keyof GenericPickerEvent,
    EntryType extends DisplayEntry
> {
    event: GenericPickerEvent<EntryType>[T]
    previousState: GenericPickerState<EntryType>
}

// NOTE: Generic typing of this class resulted in an issue where interacting with the underlying `UILogic`
//  class methods result in lots of complex type errors. I could not figure these out, but changing all the
//  `this.emitMutations` to use the `$apply` operator on the entire state instead of a per-state-key mutation
//  gets passed them. Extended classes of this should work fine.
export default abstract class GenericPickerLogic<
    EntryType extends DisplayEntry = DisplayEntry,
    Dependencies extends GenericPickerDependencies<
        EntryType
    > = GenericPickerDependencies<EntryType>,
    State extends GenericPickerState<EntryType> = GenericPickerState<EntryType>,
    Event extends GenericPickerEvent<EntryType> = GenericPickerEvent<EntryType>
> extends UILogic<State, Event> {
    private searchInputRef?: HTMLInputElement

    constructor(protected dependencies: Dependencies) {
        super()
    }

    /**
     * Only currently used for an error message.
     */
    protected abstract pickerName: string

    protected defaultEntries: EntryType[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>
    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

    getInitialState(): State {
        return {
            query: '',
            newEntryName: '',
            displayEntries: [],
            selectedEntries: [],
            loadingSuggestions: false,
            loadingQueryResults: false,
        } as State
    }

    async init() {
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

    setSearchInputRef = ({
        event: { ref },
        previousState,
    }: GenericPickerUIEvent<'setSearchInputRef', EntryType>) => {
        this.searchInputRef = ref
    }

    focusInput = () => {
        this.searchInputRef?.focus()
    }

    newTabKeys = ['Enter', ',', 'Tab']
    keyPress = ({
        event: { key },
        previousState,
    }: GenericPickerUIEvent<'keyPress', EntryType>) => {
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

    searchInputChanged = async ({
        event: { query },
        previousState,
    }: GenericPickerUIEvent<'searchInputChanged', EntryType>) => {
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

    _queryBoth = async (
        term: string,
        selectedEntries: Array<string | number>,
    ) => {
        // await this._queryLocal(term, selectedEntries)
        await this._queryRemote(term, selectedEntries)
    }

    // /**
    //  *  Searches for the term in the initial suggestions provided to the component
    //  */
    // _queryLocal = async (term: string, selectedEntries: string[]) => {
    //     const results = this._queryInitialSuggestions(term)
    //     const selected
    //     this.emitMutation({
    //         loadingQueryResults: { $set: false },
    //         displayEntries: { $set: results },
    //     })
    //     this._setCreateEntryDisplay(results, term)
    // }

    /**
     * Searches for the term via the `queryEntries` function provided to the component
     */
    _queryRemote = async (
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

    _query = debounce(this._queryBoth, 150, { leading: true })

    /**
     * If the term provided does not exist in the entry list, then set the new entry state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    _setCreateEntryDisplay = (
        list: EntryType[],
        displayEntries: EntryType[],
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
            let entry
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

    _updateFocus = (
        focusIndex: number | undefined,
        displayEntries: EntryType[],
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
    _isTermInEntryList = (entryList: EntryType[], term: string) => {
        const { selectDisplayField } = this.dependencies
        for (const entry of entryList) {
            if (selectDisplayField(entry) === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = (term) =>
        this.defaultEntries.filter((entry) =>
            this.dependencies.selectDisplayField(entry).includes(term),
        )

    selectedEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'selectedEntryPress', EntryType>) => {
        await this._updateSelectedEntryState({
            ...this._removeEntrySelected(
                entry,
                previousState.displayEntries,
                previousState.selectedEntries,
            ),
            added: null,
            deleted: entry,
        })
    }

    resultEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'resultEntryPress', EntryType>) => {
        const { selectIdField } = this.dependencies
        // Here we make the decision to make the entry result list go back to the
        // default suggested entries after an action
        // if this was prevState.displayEntries, the entry list would persist.
        const displayEntries = this.defaultEntries

        if (previousState.selectedEntries.includes(selectIdField(entry))) {
            await this._updateSelectedEntryState({
                ...this._removeEntrySelected(
                    entry.name,
                    displayEntries,
                    previousState.selectedEntries,
                ),
                added: null,
                deleted: entry.name,
            })
        } else {
            await this._updateSelectedEntryState({
                ...this._addEntrySelected(
                    entry.name,
                    displayEntries,
                    previousState.selectedEntries,
                ),
                added: entry.name,
                deleted: null,
            })
        }
    }

    resultEntryAllPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'resultEntryPress', EntryType>) => {
        // TODO: present feedback to the user?

        const name = this.validateEntry(entry.name)
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(name)

        // Note `newEntryPres` is used below to ensure when validating that this entry pressed is not
        // already selected. Otherwise the Tag All Tabs might behave strangely - i.e. Unselecting
        // from this page but still entry all the other tabs.
        await this.newEntryPress({ event: { entry: name }, previousState })
    }

    newEntryAllPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'newEntryAllPress', EntryType>) => {
        const name = this.validateEntry(entry)
        await this.newEntryPress({ event: { entry: name }, previousState })
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(name)
    }

    resultEntryFocus = ({
        event: { entry, index },
        previousState,
    }: GenericPickerUIEvent<'resultEntryFocus', EntryType>) => {
        this._updateFocus(index, previousState.displayEntries)
    }

    newEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'newEntryPress', EntryType>) => {
        entry = this.validateEntry(entry)

        if (previousState.selectedEntries.includes(entry)) {
            return
        }

        await this._updateSelectedEntryState({
            ...this._addEntrySelected(
                entry,
                this.defaultEntries,
                previousState.selectedEntries,
            ),
            added: entry,
            deleted: null,
        })
    }

    abstract validateEntry(entry: string): string

    protected _validateEntry = (entry: string) => {
        entry = entry.trim()

        if (entry === '') {
            throw Error(
                `${this.pickerName} Picker Validation: Can't add entry with only whitespace`,
            )
        }

        return entry
    }

    _updateSelectedEntryState = async ({
        displayEntries,
        selectedEntries = [],
        added,
        deleted,
        skipUpdateCallback,
    }: {
        displayEntries: EntryType[]
        selectedEntries: Array<string | number>
        added: string
        deleted: string
        skipUpdateCallback?: boolean
    }) => {
        this.emitMutation({
            $apply: (state) => ({
                ...state,
                query: '',
                newEntryName: '',
                displayEntries,
                selectedEntries,
            }),
        })

        if (skipUpdateCallback === true) {
            return
        }

        try {
            await this.dependencies.onUpdateEntrySelection({
                selected: selectedEntries,
                added,
                deleted,
            })
        } catch (e) {
            this._undoAfterError({
                displayEntries,
                selectedEntries,
                added,
                deleted,
            })
            throw e
        }
    }

    async _undoAfterError({ displayEntries, selectedEntries, added, deleted }) {
        // Reverse the logic skipping the call to run the update callback
        if (added) {
            await this._updateSelectedEntryState({
                ...this._removeEntrySelected(
                    added,
                    displayEntries,
                    selectedEntries,
                ),
                added: null,
                deleted: added,
                skipUpdateCallback: true,
            })
        } else {
            await this._updateSelectedEntryState({
                ...this._addEntrySelected(
                    deleted,
                    displayEntries,
                    selectedEntries,
                ),
                added: deleted,
                deleted: null,
                skipUpdateCallback: true,
            })
        }
    }

    _addEntrySelected = (
        entry: string,
        displayEntries: EntryType[],
        selectedEntries: Array<string | number> = [],
    ) => {
        return {
            displayEntries,
            selectedEntries: [...selectedEntries, entry],
        }
    }

    _removeEntrySelected = (
        entry: string,
        displayEntries: EntryType[],
        selectedEntries: Array<string | number> = [],
    ) => {
        const { selectIdField } = this.dependencies

        return {
            displayEntries,
            selectedEntries: selectedEntries.filter((t) => t !== entry),
        }
    }
}

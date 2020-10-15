import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'

import { KeyEvent, DisplayEntry, PickerUpdateHandler } from './types'

export const INITIAL_STATE: GenericPickerState = {
    query: '',
    newEntryName: '',
    displayEntries: [],
    selectedEntries: [],
    loadingSuggestions: false,
    loadingQueryResults: false,
}

export interface GenericPickerState {
    query?: string
    newEntryName: string
    displayEntries: DisplayEntry[]
    selectedEntries: string[]
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export interface GenericPickerDependencies {
    onUpdateEntrySelection: PickerUpdateHandler
    queryEntries: (query: string) => Promise<string[]>
    actOnAllTabs?: (query: string) => Promise<void>
    onEscapeKeyDown?: () => void | Promise<void>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
    initialSelectedEntries?: () => string[] | Promise<string[]>
    children?: any
}

export type GenericPickerDependenciesMinusSave = Omit<
    GenericPickerDependencies,
    'onUpdateEntrySelection'
>

export type GenericPickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    loadedSuggestions: {}
    loadedQueryResults: {}
    entryClicked: {}
    searchInputChanged: { query: string }
    selectedEntryPress: { entry: string }
    resultEntryAllPress: { entry: DisplayEntry }
    newEntryAllPress: { entry: string }
    resultEntryPress: { entry: DisplayEntry }
    resultEntryFocus: { entry: DisplayEntry; index: number }
    newEntryPress: { entry: string }
    keyPress: { key: KeyEvent }
    focusInput: {}
}>

interface GenericPickerUIEvent<T extends keyof GenericPickerEvent> {
    event: GenericPickerEvent[T]
    previousState: GenericPickerState
}

export default abstract class GenericPickerLogic extends UILogic<
    GenericPickerState,
    GenericPickerEvent
> {
    private searchInputRef?: HTMLInputElement

    constructor(protected dependencies: GenericPickerDependencies) {
        super()
    }

    /**
     * Only currently used for an error message.
     */
    protected abstract pickerName: string

    private defaultEntries: DisplayEntry[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>
    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

    getInitialState(): GenericPickerState {
        return {
            ...INITIAL_STATE,
            selectedEntries: [],
            displayEntries: [],
        }
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })

        const initialSelectedEntries = this.dependencies.initialSelectedEntries
            ? await this.dependencies.initialSelectedEntries()
            : []

        const defaultSuggestions =
            typeof this.dependencies.loadDefaultSuggestions === 'string'
                ? this.dependencies.loadDefaultSuggestions
                : await this.dependencies.loadDefaultSuggestions()

        this.defaultEntries = GenericPickerLogic.decorateEntryList(
            defaultSuggestions,
            initialSelectedEntries,
        )

        this.emitMutation({
            loadingSuggestions: { $set: false },
            displayEntries: { $set: this.defaultEntries },
            selectedEntries: { $set: initialSelectedEntries },
        })
    }

    setSearchInputRef = ({
        event: { ref },
        previousState,
    }: GenericPickerUIEvent<'setSearchInputRef'>) => {
        this.searchInputRef = ref
    }

    focusInput = () => {
        this.searchInputRef?.focus()
    }

    newTabKeys = ['Enter', ',', 'Tab']
    keyPress = ({
        event: { key },
        previousState,
    }: GenericPickerUIEvent<'keyPress'>) => {
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
    }: GenericPickerUIEvent<'searchInputChanged'>) => {
        this.emitMutation({
            query: { $set: query },
            newEntryName: { $set: query },
        })

        if (!query || query === '') {
            this.emitMutation({
                displayEntries: { $set: this.defaultEntries },
                query: { $set: '' },
                newEntryName: { $set: '' },
            })
        } else {
            return this._query(query, previousState.selectedEntries)
        }
    }

    _queryBoth = async (term: string, selectedEntries: string[]) => {
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
    _queryRemote = async (term: string, selectedEntries: string[]) => {
        this.emitMutation({ loadingQueryResults: { $set: true } })
        const results = await this.dependencies.queryEntries(term)
        results.sort()
        const displayEntries = GenericPickerLogic.decorateEntryList(
            results,
            selectedEntries,
        )
        this.emitMutation({
            loadingQueryResults: { $set: false },
            displayEntries: {
                $set: displayEntries,
            },
        })
        this._setCreateEntryDisplay(results, displayEntries, term)
    }

    _query = debounce(this._queryBoth, 150, { leading: true })

    /**
     * If the term provided does not exist in the entry list, then set the new entry state to the term.
     * (controls the 'Add a new Tag: ...')
     */
    _setCreateEntryDisplay = (
        list: string[],
        displayEntries: DisplayEntry[],
        term: string,
    ) => {
        if (this._isTermInEntryList(list, term)) {
            this.emitMutation({
                newEntryName: { $set: '' },
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
                newEntryName: { $set: entry },
            })
            this._updateFocus(-1, displayEntries)
        }
    }

    _updateFocus = (
        focusIndex: number | undefined,
        displayEntries: DisplayEntry[],
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
                displayEntries: { $set: displayEntries },
            })
    }

    /**
     * Loops through a list of entries and exits if a match is found
     */
    _isTermInEntryList = (entryList: string[], term: string) => {
        for (const entry of entryList) {
            if (entry === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = (term) =>
        this.defaultEntries.filter((entry) => entry.name.includes(term))

    selectedEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'selectedEntryPress'>) => {
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
    }: GenericPickerUIEvent<'resultEntryPress'>) => {
        // Here we make the decision to make the entry result list go back to the
        // default suggested entries after an action
        // if this was prevState.displayEntries, the entry list would persist.
        const displayEntries = this.defaultEntries

        if (entry.selected) {
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
    }: GenericPickerUIEvent<'resultEntryPress'>) => {
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
    }: GenericPickerUIEvent<'newEntryAllPress'>) => {
        const name = this.validateEntry(entry)
        await this.newEntryPress({ event: { entry: name }, previousState })
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(name)
    }

    resultEntryFocus = ({
        event: { entry, index },
        previousState,
    }: GenericPickerUIEvent<'resultEntryFocus'>) => {
        this._updateFocus(index, previousState.displayEntries)
    }

    newEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'newEntryPress'>) => {
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
                `${this.pickerName} Validation: Can't add entry with only whitespace`,
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
        displayEntries: DisplayEntry[]
        selectedEntries: string[]
        added: string
        deleted: string
        skipUpdateCallback?: boolean
    }) => {
        this.emitMutation({
            query: { $set: '' },
            newEntryName: { $set: '' },
            displayEntries: { $set: displayEntries },
            selectedEntries: { $set: selectedEntries },
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
        displayEntries: DisplayEntry[],
        selectedEntries: string[] = [],
    ) => {
        for (const i in displayEntries) {
            if (displayEntries[i].name === entry) {
                displayEntries[i].selected = true
                break
            }
        }

        return {
            displayEntries,
            selectedEntries: [...selectedEntries, entry],
        }
    }

    _removeEntrySelected = (
        entry: string,
        displayEntries: DisplayEntry[],
        selectedEntries: string[] = [],
    ) => {
        for (const i in displayEntries) {
            if (displayEntries[i].name === entry) {
                displayEntries[i].selected = false
                break
            }
        }

        return {
            displayEntries,
            selectedEntries: selectedEntries.filter((t) => t !== entry),
        }
    }

    /**
     * Takes a list of entry results and selected entries and combines them to return whichentry
     * is selected and which is not.
     */
    static decorateEntryList = (
        entryList: string[],
        selectedEntries: string[],
    ): DisplayEntry[] =>
        entryList.map((entry) => ({
            name: entry,
            focused: false,
            selected: selectedEntries?.includes(entry) ?? false,
        }))
}

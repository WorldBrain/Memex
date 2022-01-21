import { UILogic, UIEvent, UIMutation } from 'ui-logic-core'
import debounce from 'lodash/debounce'

import type { KeyEvent, DisplayEntry } from './types'

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
    createNewEntry: (name: string) => Promise<string | number>
    selectEntry: (id: string | number) => Promise<void>
    unselectEntry: (id: string | number) => Promise<void>
    getEntryIdField: (entry: EntryType) => string | number
    getEntryDisplayField: (entry: EntryType) => string
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
> = GenericPickerDependencies<EntryType>

export type GenericPickerEvent<
    EntryType extends DisplayEntry = DisplayEntry
> = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
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
    private _setCreateEntryDisplay = (
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
    private _isTermInEntryList = (entryList: EntryType[], term: string) => {
        const { getEntryDisplayField } = this.dependencies
        for (const entry of entryList) {
            if (getEntryDisplayField(entry) === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = (term) =>
        this.defaultEntries.filter((entry) =>
            this.dependencies.getEntryDisplayField(entry).includes(term),
        )

    selectedEntryPress = async ({
        event: { entry: entryName },
        previousState,
    }: GenericPickerUIEvent<'selectedEntryPress', EntryType>) => {
        const {
            getEntryDisplayField,
            getEntryIdField,
            unselectEntry,
        } = this.dependencies
        const entry = previousState.displayEntries.find(
            (entry) => getEntryDisplayField(entry) === entryName,
        )

        this.emitMutation({
            selectedEntries: {
                $set: previousState.selectedEntries.filter(
                    (id) => id !== getEntryIdField(entry),
                ),
            },
        } as UIMutation<State>)

        await unselectEntry(getEntryIdField(entry))
    }

    resultEntryPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'resultEntryPress', EntryType>) => {
        const {
            getEntryIdField,
            unselectEntry,
            selectEntry,
        } = this.dependencies
        const entryId = getEntryIdField(entry)

        if (previousState.selectedEntries.includes(entryId)) {
            this.emitMutation({
                selectedEntries: {
                    $set: previousState.selectedEntries.filter(
                        (id) => id !== entryId,
                    ),
                },
            } as UIMutation<State>)
            await unselectEntry(entryId)
        } else {
            this.emitMutation({
                selectedEntries: { $push: [entryId] },
            } as UIMutation<State>)
            await selectEntry(entryId)
        }
    }

    resultEntryAllPress = async ({
        event: { entry },
        previousState,
    }: GenericPickerUIEvent<'resultEntryPress', EntryType>) => {
        const {
            getEntryIdField,
            selectEntry,
            unselectEntry,
        } = this.dependencies
        const name = this.validateEntry(entry.name)
        this._processingUpstreamOperation = this.dependencies.actOnAllTabs(name)

        const isAlreadySelected = previousState.selectedEntries.includes(
            getEntryIdField(entry),
        )

        this.emitMutation({
            selectedEntries: {
                $set: isAlreadySelected
                    ? previousState.selectedEntries.filter(
                          (entryId) => entryId !== getEntryIdField(entry),
                      )
                    : [
                          ...previousState.selectedEntries,
                          getEntryIdField(entry),
                      ],
            },
        } as UIMutation<State>)
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

        const newId = await this.dependencies.createNewEntry(entry)

        this.emitMutation({
            query: { $set: '' },
            newEntryName: { $set: '' },
            selectedEntries: { $push: [newId] },
            displayEntries: {
                $set: [
                    ...this.defaultEntries,
                    { localId: newId, focused: false, name: entry },
                ],
            },
        } as UIMutation<State>)
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
}

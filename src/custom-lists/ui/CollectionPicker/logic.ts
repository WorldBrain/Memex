import { UILogic, UIEvent } from 'ui-logic-core'
import debounce from 'lodash/debounce'
import { KeyEvent } from 'src/common-ui/GenericPicker/types'

export const INITIAL_STATE = {
    query: '',
    newListName: '',
    selectedLists: [],
    loadingQueryResults: false,
    loadingSuggestions: false,
}

export interface ListPickerState {
    query?: string
    newListName: string
    selectedLists: string[]
    displayLists: DisplayList[]
    loadingSuggestions: boolean
    loadingQueryResults: boolean
}

export interface ListPickerDependencies {
    onUpdateListSelection: (
        lists: string[],
        added: string,
        deleted: string,
    ) => Promise<void>
    queryLists: (query: string) => Promise<string[]>
    listAllTabs?: (query: string) => Promise<void>
    loadDefaultSuggestions: () => string[] | Promise<string[]>
    initialSelectedLists?: () => Promise<string[]>
    children?: any
}

export type ListPickerEvent = UIEvent<{
    setSearchInputRef: { ref: HTMLInputElement }
    loadedSuggestions: {}
    loadedQueryResults: {}
    listClicked: {}
    searchInputChanged: { query: string }
    selectedListPress: { list: string }
    resultListAllPress: { list: DisplayList }
    newListAllPress: {}
    resultListPress: { list: DisplayList }
    resultListFocus: { list: DisplayList; index: number }
    newListPress: { list: string }
    keyPress: { key: KeyEvent }
    focusInput: {}
}>

interface ListPickerUIEvent<T extends keyof ListPickerEvent> {
    event: ListPickerEvent[T]
    previousState: ListPickerState
}

export default class ListPickerLogic extends UILogic<
    ListPickerState,
    ListPickerEvent
> {
    private searchInputRef?: HTMLInputElement

    constructor(private dependencies: ListPickerDependencies) {
        super()
    }

    private defaultLists: DisplayList[] = []
    private focusIndex = -1

    // For now, the only thing that needs to know if this has finished, is the tests.
    private _processingUpstreamOperation: Promise<void>
    get processingUpstreamOperation() {
        return this._processingUpstreamOperation
    }
    set processingUpstreamOperation(val) {
        this._processingUpstreamOperation = val
    }

    getInitialState(): ListPickerState {
        return {
            ...INITIAL_STATE,
            selectedLists: [],
            displayLists: [],
        }
    }

    init = async () => {
        this.emitMutation({ loadingSuggestions: { $set: true } })

        const initialSelectedLists = await this.dependencies.initialSelectedLists()
        const defaultSuggestions =
            typeof this.dependencies.loadDefaultSuggestions === 'string'
                ? this.dependencies.loadDefaultSuggestions
                : await this.dependencies.loadDefaultSuggestions()

        this.defaultLists = ListPickerLogic.decorateListList(
            defaultSuggestions,
            initialSelectedLists,
        )

        this.emitMutation({
            loadingSuggestions: { $set: false },
            displayLists: { $set: this.defaultLists },
            selectedLists: { $set: initialSelectedLists },
        })
    }

    setSearchInputRef = ({
        event: { ref },
        previousState,
    }: ListPickerUIEvent<'setSearchInputRef'>) => {
        this.searchInputRef = ref
    }

    focusInput = () => {
        this.searchInputRef?.focus()
    }

    newTabKeys = ['Enter', ',', 'Tab']
    keyPress = ({
        event: { key },
        previousState,
    }: ListPickerUIEvent<'keyPress'>) => {
        if (this.newTabKeys.includes(key)) {
            if (previousState.newListName !== '' && !(this.focusIndex >= 0)) {
                return this.newListPress({
                    previousState,
                    event: { list: previousState.newListName },
                })
            }

            if (previousState.displayLists[this.focusIndex]) {
                return this.resultListPress({
                    event: {
                        list: previousState.displayLists[this.focusIndex],
                    },
                    previousState,
                })
            }
        }

        if (key === 'ArrowUp') {
            if (this.focusIndex > -1) {
                return this._updateFocus(
                    --this.focusIndex,
                    previousState.displayLists,
                )
            }
        }

        if (key === 'ArrowDown') {
            if (this.focusIndex < previousState.displayLists.length - 1) {
                return this._updateFocus(
                    ++this.focusIndex,
                    previousState.displayLists,
                )
            }
        }
    }

    searchInputChanged = async ({
        event: { query },
        previousState,
    }: ListPickerUIEvent<'searchInputChanged'>) => {
        this.emitMutation({
            query: { $set: query },
            // Opportunistically set the new list name before searching
            newListName: { $set: query },
        })

        if (!query || query === '') {
            this.emitMutation({
                displayLists: { $set: this.defaultLists },
                query: { $set: '' },
                newListName: { $set: '' },
            })
        } else {
            return this._query(query, previousState.selectedLists)
        }
    }

    _queryBoth = async (term: string, selectedLists: string[]) => {
        // await this._queryLocal(term, selectedLists)
        await this._queryRemote(term, selectedLists)
    }

    // /**
    //  *  Searches for the term in the initial suggestions provided to the component
    //  */
    // _queryLocal = async (term: string, selectedLists: string[]) => {
    //     const results = this._queryInitialSuggestions(term)
    //     const selected
    //     this.emitMutation({
    //         loadingQueryResults: { $set: false },
    //         displayLists: { $set: results },
    //     })
    //     this._setCreateListDisplay(results, term)
    // }

    /**
     * Searches for the term via the `queryLists` function provided to the component
     */
    _queryRemote = async (term: string, selectedLists: string[]) => {
        this.emitMutation({ loadingQueryResults: { $set: true } })
        const results = await this.dependencies.queryLists(term)
        results.sort()
        const displayLists = ListPickerLogic.decorateListList(
            results,
            selectedLists,
        )
        this.emitMutation({
            loadingQueryResults: { $set: false },
            displayLists: {
                $set: displayLists,
            },
        })
        this._setCreateListDisplay(results, displayLists, term)
    }

    _query = debounce(this._queryBoth, 150, { leading: true })

    /**
     * If the term provided does not exist in the list list, then set the new list state to the term.
     * (controls the 'Add a new List: ...')
     */
    _setCreateListDisplay = (
        list: string[],
        displayLists: DisplayList[],
        term: string,
    ) => {
        if (this._isTermInListList(list, term)) {
            this.emitMutation({
                newListName: { $set: '' },
            })
            // N.B. We update this focus index to this found list, so that
            // enter keys will action it. But we don't emit that focus
            // to the user, because otherwise the style of the button changes
            // showing the tick and it might seem like it's already selected.
            this._updateFocus(0, displayLists, false)
        } else {
            let list
            try {
                list = this._validateList(term)
            } catch (e) {
                return
            }
            this.emitMutation({
                newListName: { $set: list },
            })
            this._updateFocus(-1, displayLists)
        }
    }

    _updateFocus = (
        focusIndex: number | undefined,
        displayLists: DisplayList[],
        emit = true,
    ) => {
        this.focusIndex = focusIndex ?? -1
        if (!displayLists) {
            return
        }

        for (let i = 0; i < displayLists.length; i++) {
            displayLists[i].focused = focusIndex === i
        }

        emit &&
            this.emitMutation({
                displayLists: { $set: displayLists },
            })
    }

    /**
     * Loops through a list of lists and exits if a match is found
     */
    _isTermInListList = (listList: string[], term: string) => {
        for (const list of listList) {
            if (list === term) {
                return true
            }
        }
        return false
    }

    _queryInitialSuggestions = (term) =>
        this.defaultLists.filter((list) => list.name.includes(term))

    selectedListPress = async ({
        event: { list },
        previousState,
    }: ListPickerUIEvent<'selectedListPress'>) => {
        await this._updateSelectedListState({
            ...this._removeListSelected(
                list,
                previousState.displayLists,
                previousState.selectedLists,
            ),
            added: null,
            deleted: list,
        })
    }

    resultListPress = async ({
        event: { list },
        previousState,
    }: ListPickerUIEvent<'resultListPress'>) => {
        // Here we make the decision to make the list result list go back to the
        // default suggested lists after an action
        // if this was prevState.displayLists, the list list would persist.
        const displayLists = this.defaultLists

        if (list.selected) {
            await this._updateSelectedListState({
                ...this._removeListSelected(
                    list.name,
                    displayLists,
                    previousState.selectedLists,
                ),
                added: null,
                deleted: list.name,
            })
        } else {
            await this._updateSelectedListState({
                ...this._addListSelected(
                    list.name,
                    displayLists,
                    previousState.selectedLists,
                ),
                added: list.name,
                deleted: null,
            })
        }
    }

    resultListAllPress = async ({
        event: { list },
        previousState,
    }: ListPickerUIEvent<'resultListPress'>) => {
        // TODO: present feedback to the user?

        const name = this._validateList(list.name)
        this._processingUpstreamOperation = this.dependencies.listAllTabs(name)

        // Note `newListPres` is used below to ensure when validating that this list pressed is not
        // already selected. Otherwise the List All Tabs might behave strangely - i.e. Unselecting
        // from this page but still list all the other tabs.
        await this.newListPress({ event: { list: name }, previousState })
    }

    newListAllPress = async ({
        event: {},
        previousState,
    }: ListPickerUIEvent<'newListAllPress'>) => {
        const list = this._validateList(previousState.query)
        await this.newListPress({ event: { list: name }, previousState })
        this._processingUpstreamOperation = this.dependencies.listAllTabs(list)
    }

    resultListFocus = ({
        event: { list, index },
        previousState,
    }: ListPickerUIEvent<'resultListFocus'>) => {
        this._updateFocus(index, previousState.displayLists)
    }

    newListPress = async ({
        event: { list },
        previousState,
    }: ListPickerUIEvent<'newListPress'>) => {
        list = this._validateList(list)

        if (previousState.selectedLists.includes(list)) {
            return
        }

        await this._updateSelectedListState({
            ...this._addListSelected(
                list,
                this.defaultLists,
                previousState.selectedLists,
            ),
            added: list,
            deleted: null,
        })
    }

    _validateList = (list: string) => {
        list = list.trim()

        if (list === '') {
            throw Error(`List Validation: Can't add list with only whitespace`)
        }
        return list
    }

    _updateSelectedListState = async ({
        displayLists,
        selectedLists = [],
        added,
        deleted,
        skipUpdateCallback,
    }: {
        displayLists: DisplayList[]
        selectedLists: string[]
        added: string
        deleted: string
        skipUpdateCallback?: boolean
    }) => {
        this.emitMutation({
            query: { $set: '' },
            newListName: { $set: '' },
            displayLists: { $set: displayLists },
            selectedLists: { $set: selectedLists },
        })

        if (skipUpdateCallback === true) {
            return
        }

        try {
            await this.dependencies.onUpdateListSelection(
                selectedLists,
                added,
                deleted,
            )
        } catch (e) {
            this._undoAfterError({
                displayLists,
                selectedLists,
                added,
                deleted,
            })
            throw e
        }
    }

    async _undoAfterError({ displayLists, selectedLists, added, deleted }) {
        // Reverse the logic skipping the call to run the update callback
        if (added) {
            await this._updateSelectedListState({
                ...this._removeListSelected(added, displayLists, selectedLists),
                added: null,
                deleted: added,
                skipUpdateCallback: true,
            })
        } else {
            await this._updateSelectedListState({
                ...this._addListSelected(deleted, displayLists, selectedLists),
                added: deleted,
                deleted: null,
                skipUpdateCallback: true,
            })
        }
    }

    _addListSelected = (
        list: string,
        displayLists: DisplayList[],
        selectedLists: string[] = [],
    ) => {
        for (const i in displayLists) {
            if (displayLists[i].name === list) {
                displayLists[i].selected = true
                break
            }
        }

        return {
            displayLists,
            selectedLists: [...selectedLists, list],
        }
    }

    _removeListSelected = (
        list: string,
        displayLists: DisplayList[],
        selectedLists: string[] = [],
    ) => {
        for (const i in displayLists) {
            if (displayLists[i].name === list) {
                displayLists[i].selected = false
                break
            }
        }

        return {
            displayLists,
            selectedLists: selectedLists.filter((t) => t !== list),
        }
    }

    /**
     * Takes a list of list results and selected lists and combines them to return which list
     * is selected and which is not.
     */
    static decorateListList = (
        listList: string[],
        selectedLists: string[],
    ): DisplayList[] =>
        listList.map((list) => ({
            name: list,
            focused: false,
            selected: selectedLists?.includes(list) ?? false,
        }))
}

export interface DisplayList {
    name: string
    selected: boolean
    focused: boolean
}

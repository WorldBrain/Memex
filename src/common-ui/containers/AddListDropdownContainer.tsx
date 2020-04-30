import React, { Component } from 'react'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from '../../util/webextensionRPC'
import {
    IndexDropdownNewRow,
    IndexDropdown,
    IndexDropdownRow,
} from '../components'
import { PageList } from '../../custom-lists/background/types'
import { ClickHandler } from '../../popup/types'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'
import * as Raven from 'src/util/raven'

export interface Props {
    env?: 'inpage' | 'overview'
    mode: string
    url?: string
    initLists: PageList[]
    initSuggestions?: PageList[]
    onBackBtnClick?: ClickHandler<HTMLButtonElement>
    onFilterAdd?: (collection: PageList) => void
    onFilterDel?: (collection: PageList) => void
    bulkAddPagesToList?: () => void
    bulkRemovePagesFromList?: () => void
    applyBulkEdits?: () => void
    resetPagesInTempList?: () => void
    setTempLists?: () => void
    allTabsCollection?: boolean
    isList: boolean
    isForRibbon: boolean
    addPageToListRPC?: string
    delPageFromListRPC?: string
    onListClickCb?: () => void
}

export interface State {
    showError: boolean
    errMsg: string
    searchVal: string
    isLoading: boolean
    displayFilters: PageList[]
    filters: PageList[]
    focused: number
    multiEdit: Set<number>
}

class AddListDropdownContainer extends Component<Props, State> {
    static defaultProps: Partial<Props> = {
        onFilterAdd: noop,
        onFilterDel: noop,
        initLists: [],
        isForRibbon: false,
        addPageToListRPC: 'insertPageToList',
        delPageFromListRPC: 'removePageFromList',
        onListClickCb: noop,
    }

    private err: { timestamp: number; err: Error }
    private addListRPC
    private addPageToListRPC
    private deletePageFromListRPC
    private addOpenTabsToListRPC
    private removeOpenTabsFromListRPC
    private fetchListByIdRPC
    private fetchListNameSuggestionsRPC
    private inputEl: HTMLInputElement

    constructor(props: Props) {
        super(props)

        this.addListRPC = remoteFunction('createCustomList')
        this.addPageToListRPC = remoteFunction(props.addPageToListRPC)
        this.deletePageFromListRPC = remoteFunction(props.delPageFromListRPC)
        this.addOpenTabsToListRPC = remoteFunction('addOpenTabsToList')
        this.removeOpenTabsFromListRPC = remoteFunction(
            'removeOpenTabsFromList',
        )
        this.fetchListByIdRPC = remoteFunction('__fetchListById')
        this.fetchListNameSuggestionsRPC = remoteFunction(
            '__fetchListNameSuggestions',
        )

        this.fetchListSuggestions = debounce(300)(this.fetchListSuggestions)

        this.state = {
            errMsg: '',
            searchVal: '',
            isLoading: false,
            showError: false,
            displayFilters: props.initSuggestions
                ? props.initSuggestions
                : props.initLists, // Display state objects; will change all the time
            filters: props.initLists, // Actual lists associated with the page; will only change when DB updates
            focused: props.initLists.length ? 0 : -1,
            multiEdit: new Set<number>(),
        }
    }

    componentDidMount() {
        // The temporary list array gets updated.
        if (this.overviewMode) {
            this.props.setTempLists()
        }
    }

    componentWillUnmount() {
        if (this.err && Date.now() - this.err.timestamp <= 1000) {
            handleDBQuotaErrors(
                (err) =>
                    notifications.create({
                        requireInteraction: false,
                        title: 'Memex error: list adding',
                        message: err.message,
                    }),
                () => remoteFunction('dispatchNotification')('db_error'),
            )(this.err.err)
        }
    }

    componentDidUpdate(prevProps: Props) {
        // Checking for initLists' length is better as component updates only
        // when a list is added or deleted, which implies that the length of
        // props.initLists will differ across two updates.
        if (
            prevProps.initLists !== undefined &&
            this.props.initLists !== undefined &&
            prevProps.initLists.length !== this.props.initLists.length
        ) {
            this.setState({
                displayFilters: this.props.initSuggestions
                    ? this.props.initSuggestions
                    : this.props.initLists,
                filters: this.props.initLists,
            })
        }
    }

    /**
     * Decides whether or not to allow index update. Currently determined by
     * `props.url` setting.
     */
    private get allowIndexUpdate() {
        return this.props.url != null
    }

    private get overviewMode() {
        return this.props.mode === 'overview'
    }

    scrollElementIntoViewIfNeeded(domNode: HTMLElement) {
        // const parentNode = domNode.parentNode
        // parentNode.scrollTop = domNode.offsetTop - parentNode.offsetTop
        domNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        // Gives error in FF.
        // domNode.scrollIntoViewIfNeeded()
    }

    private pageBelongsToList = (list: PageList) =>
        !(
            this.state.filters.findIndex((filter) => filter.id === list.id) ===
            -1
        )
    private setInputRef = (el: HTMLInputElement) => (this.inputEl = el)

    private canCreateList() {
        if (!this.allowIndexUpdate) {
            return false
        }

        const searchVal = this.getSearchVal()

        return (
            !!searchVal.length &&
            !this.state.displayFilters.reduce(
                (acc, tag) => acc || tag.name === searchVal,
                false,
            )
        )
    }

    private handleError = (err: Error) => {
        Raven.captureException(err)
        this.setState(() => ({ showError: true, errMsg: err.message }))
        this.err = {
            timestamp: Date.now(),
            err,
        }
    }

    /**
     * Used for 'Enter' presses or 'Add new tag' clicks.
     */
    private createList = async () => {
        await this.props.onListClickCb()

        const listName = this.getSearchVal()

        if (this.allowIndexUpdate) {
            try {
                // Add a list as well as add this page to the list.
                const id = await this.addListRPC({ name: listName })
                if (this.props.allTabsCollection) {
                    this.setState((state) => ({
                        multiEdit: state.multiEdit.add(id),
                    }))
                    await this.addOpenTabsToListRPC({ listId: id })
                } else {
                    await this.addPageToListRPC({ id, url: this.props.url })
                }
                // Get the list that was added.
                const newList = await this.fetchListByIdRPC({ id })

                this.props.onFilterAdd(newList)
            } catch (err) {
                this.handleError(err)
            }
        }

        this.inputEl.focus()

        // Clear the component state.
        this.setState({ searchVal: '', focused: 0 })
    }

    /**
     * Selector for derived display lists state
     */
    private getDisplayLists = () =>
        this.state.displayFilters.map((value, i) => ({
            value,
            active: this.props.allTabsCollection
                ? this.state.multiEdit.has(value.id)
                : value.active,
            focused: this.state.focused === i,
        }))

    private getSearchVal = () =>
        this.state.searchVal.trim().replace(/\s\s+/g, ' ')

    private fetchListSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        try {
            suggestions = await this.fetchListNameSuggestionsRPC({
                name: searchVal,
                url: this.props.url,
            })
        } catch (err) {
            this.handleError(err)
        }

        this.setState((state) => ({
            ...state,
            displayFilters: suggestions || [],
            focused: 0,
        }))
    }

    private handleSearchEnterPress = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            this.canCreateList() &&
            this.state.focused === this.state.displayFilters.length
        ) {
            return this.createList()
        }

        if (this.state.displayFilters.length) {
            // return this.handleListSelection(this.state.focused)(event)
            return this.handleListClick(this.state.focused)(event)
        }

        return null
    }

    private async handleSingleCollectionEdit(list) {
        let updateState
        let revertState
        let updateDb

        if (this.pageBelongsToList(list)) {
            updateState = this.props.onFilterDel
            revertState = this.props.onFilterAdd
            updateDb = this.deletePageFromListRPC
        } else {
            updateState = this.props.onFilterAdd
            revertState = this.props.onFilterDel
            updateDb = this.addPageToListRPC
        }

        updateState(list)

        try {
            await updateDb({ id: list.id, url: this.props.url })
        } catch (err) {
            this.handleError(err)
            revertState(list)
        }
    }

    private async handleMultiCollectionEdit(list) {
        const { multiEdit } = this.state
        let opPromise: Promise<any>

        if (!multiEdit.has(list.id)) {
            multiEdit.add(list.id)
            opPromise = this.addOpenTabsToListRPC({
                listId: list.id,
                listName: list.name,
            })
        } else {
            multiEdit.delete(list.id)
            opPromise = this.removeOpenTabsFromListRPC({ listId: list.id })
        }

        // Allow state update to happen optimistically before async stuff is done
        this.setState(() => ({ multiEdit }))
        await opPromise
    }

    /**
     * Used for clicks on displayed lists. Will either add or remove lists to
     * the page depending on their current status as associated lists or not.
     */
    private handleListClick = (index: number) => async (event) => {
        await this.props.onListClickCb()

        const list = this.state.displayFilters[index]

        // Either add or remove the list, let Redux handle the store changes.
        if (this.props.allTabsCollection) {
            await this.handleMultiCollectionEdit(list)
        } else {
            await this.handleSingleCollectionEdit(list)
        }

        this.inputEl.focus()

        // Clear the component state.
        this.setState({
            searchVal: '',
            focused: 0,
        })
    }

    private handleSearchArrowPress = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        event.preventDefault()

        // One extra index of the "add new list" option is showing.
        let offset = this.canCreateList() ? 0 : 1

        if (!this.allowIndexUpdate) {
            offset = 1
        }

        // Calculate the next focused index depending on current focus and direction
        let focusedReducer
        if (event.key === 'ArrowUp') {
            focusedReducer = (focused) =>
                focused < 1
                    ? this.state.displayFilters.length - offset
                    : focused - 1
        } else {
            focusedReducer = (focused) =>
                focused === this.state.displayFilters.length - offset
                    ? 0
                    : focused + 1
        }

        this.setState((state) => ({
            ...state,
            focused: focusedReducer(state.focused),
        }))
    }

    private handleSearchChange = (searchVal: string) => {
        // If user backspaces to clear input, show the list of suggested lists again.
        const displayFilters = !searchVal.length
            ? this.props.initSuggestions
                ? this.props.initSuggestions
                : this.props.initLists
            : this.state.displayFilters

        this.setState(
            (state) => ({ ...state, searchVal, displayFilters }),
            this.fetchListSuggestions, // Debounced suggestion fetch
        )
    }

    private renderLists() {
        let listOpts: React.ReactNode[] = this.getDisplayLists().map(
            (list, i) => (
                <IndexDropdownRow
                    {...list}
                    key={i}
                    onClick={this.handleListClick(i)}
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                    isForSidebar={false}
                    isList
                />
            ),
        )

        if (this.canCreateList()) {
            listOpts = [
                <IndexDropdownNewRow
                    key="+"
                    value={this.state.searchVal}
                    onClick={this.createList}
                    isList={1}
                    focused={
                        this.state.focused === this.state.displayFilters.length
                    }
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                />,
                ...listOpts,
            ]
        }

        return listOpts
    }

    render() {
        return (
            <IndexDropdown
                onTagSearchChange={this.handleSearchChange}
                onTagSearchSpecialKeyHandlers={[
                    {
                        test: (e) =>
                            e.key === 'ArrowDown' || e.key === 'ArrowUp',
                        handle: (e) => this.handleSearchArrowPress(e),
                    },
                    {
                        test: (e) => e.key === 'Enter',
                        handle: (e) => this.handleSearchEnterPress(e),
                    },
                ]}
                setInputRef={this.setInputRef}
                tagSearchValue={this.state.searchVal}
                source="list"
                {...this.state}
                {...this.props}
            >
                {this.renderLists()}
            </IndexDropdown>
        )
    }
}

export default AddListDropdownContainer

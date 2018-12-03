import React, { Component } from 'react'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { updateLastActive } from '../../analytics'
import { remoteFunction } from '../../util/webextensionRPC'
import {
    IndexDropdownNewRow,
    IndexDropdown,
    IndexDropdownRow,
} from '../components'
import { PageList } from '../../custom-lists/background/types'
import { ClickHandler } from '../../popup/types'

export interface Props {
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
}

export interface State {
    searchVal: string
    isLoading: boolean
    displayFilters: PageList[]
    filters: PageList[]
    focused: number
}

class AddListDropdownContainer extends Component<Props, State> {
    static defaultProps: Partial<Props> = {
        onFilterAdd: noop,
        onFilterDel: noop,
        initLists: [],
    }

    private addListRPC
    private addPageToListRPC
    private deletePageFromListRPC
    private fetchListByIdRPC
    private fetchListNameSuggestionsRPC
    private inputEl: HTMLInputElement

    constructor(props: Props) {
        super(props)

        this.addListRPC = remoteFunction('createCustomList')
        this.addPageToListRPC = remoteFunction('insertPageToList')
        this.deletePageFromListRPC = remoteFunction('removePageFromList')
        this.fetchListByIdRPC = remoteFunction('fetchListById')
        this.fetchListNameSuggestionsRPC = remoteFunction(
            'fetchListNameSuggestions',
        )

        this.fetchListSuggestions = debounce(300)(this.fetchListSuggestions)

        this.state = {
            searchVal: '',
            isLoading: false,
            displayFilters: props.initSuggestions
                ? props.initSuggestions
                : props.initLists, // Display state objects; will change all the time
            filters: props.initLists, // Actual lists associated with the page; will only change when DB updates
            focused: props.initLists.length ? 0 : -1,
        }
    }

    componentWillMount() {
        // The temporary list array gets updated.
        if (this.overviewMode) {
            this.props.setTempLists()
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
        !(this.state.filters.findIndex(filter => filter.id === list.id) === -1)
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

    // private addPageToList = () => {}

    /**
     * Used for 'Enter' presses or 'Add new tag' clicks.
     */
    private createList = async () => {
        const listName = this.getSearchVal()

        if (this.allowIndexUpdate) {
            try {
                // Add a list as well as add this page to the list.
                const id = await this.addListRPC({ name: listName })
                await this.addPageToListRPC({ id, url: this.props.url })

                // Get the list that was added.
                const newList = await this.fetchListByIdRPC({ id })

                this.props.onFilterAdd(newList)
            } catch (err) {
                console.error(err)
            }
        }

        this.inputEl.focus()

        // Clear the component state.
        this.setState({ searchVal: '', focused: 0 })

        updateLastActive() // Consider user active (analytics)
    }

    /**
     * Selector for derived display lists state
     */
    private getDisplayLists = () =>
        this.state.displayFilters.map((value, i) => ({
            value,
            active: value.active,
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
            console.log(err)
        }

        this.setState(state => ({
            ...state,
            displayFilters: suggestions || [],
            focused: 0,
        }))
    }

    private handleSearchEnterPress = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        event.preventDefault()

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

    /**
     * Used for clicks on displayed lists. Will either add or remove lists to
     * the page depending on their current status as associated lists or not.
     */
    private handleListClick = (index: number) => async event => {
        const list = this.state.displayFilters[index]

        // Either add or remove the list, let Redux handle the store changes.
        if (!this.pageBelongsToList(list)) {
            if (this.allowIndexUpdate) {
                this.addPageToListRPC({
                    id: list.id,
                    url: this.props.url,
                }).catch(console.error)
            }

            this.props.onFilterAdd(list)
        } else {
            if (this.allowIndexUpdate) {
                this.deletePageFromListRPC({
                    id: list.id,
                    url: this.props.url,
                }).catch(console.error)
            }

            this.props.onFilterDel(list)
        }

        this.inputEl.focus()

        // Clear the component state.
        this.setState({
            searchVal: '',
            focused: 0,
        })

        updateLastActive() // Consider user active (analytics)
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
            focusedReducer = focused =>
                focused < 1
                    ? this.state.displayFilters.length - offset
                    : focused - 1
        } else {
            focusedReducer = focused =>
                focused === this.state.displayFilters.length - offset
                    ? 0
                    : focused + 1
        }

        this.setState(state => ({
            ...state,
            focused: focusedReducer(state.focused),
        }))
    }

    private handleSearchKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        switch (event.key) {
            case 'Enter':
                return this.handleSearchEnterPress(event)
            case 'ArrowUp':
            case 'ArrowDown':
                return this.handleSearchArrowPress(event)
            default:
        }
    }

    private handleSearchChange = (
        event: React.SyntheticEvent<HTMLInputElement>,
    ) => {
        const searchVal = event.currentTarget.value

        // If user backspaces to clear input, show the list of suggested lists again.
        const displayFilters = !searchVal.length
            ? this.props.initSuggestions
                ? this.props.initSuggestions
                : this.props.initLists
            : this.state.displayFilters

        this.setState(
            state => ({ ...state, searchVal, displayFilters }),
            this.fetchListSuggestions, // Debounced suggestion fetch
        )
    }

    private renderLists() {
        const lists = this.getDisplayLists()

        const listOptions = lists.map((list, i) => (
            <IndexDropdownRow
                {...list}
                key={i}
                onClick={this.handleListClick(i)}
                scrollIntoView={this.scrollElementIntoViewIfNeeded}
                isForSidebar={false}
            />
        ))

        if (this.canCreateList()) {
            listOptions.push(
                <IndexDropdownNewRow
                    key="+"
                    value={this.state.searchVal}
                    onClick={this.createList}
                    focused={
                        this.state.focused === this.state.displayFilters.length
                    }
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                />,
            )
        }

        return listOptions
    }

    render() {
        return (
            // <AddListDropdown
            // onTagSearchChange={this.handleSearchChange}
            // onTagSearchKeyDown={this.handleSearchKeyDown}
            //     setInputRef={this.setInputRef}
            //     tagSearchValue={this.state.searchVal}
            //     overviewMode={this.overviewMode()}
            //     numberOfTags={this.state.filters.length}
            //     {...this.props}
            // >
            //     {this.renderLists()}
            // </AddListDropdown>
            <IndexDropdown
                onTagSearchChange={this.handleSearchChange}
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={this.state.filters.length}
                tagSearchValue={this.state.searchVal}
                source="list"
                {...this.props}
            >
                {this.renderLists()}
            </IndexDropdown>
        )
    }
}

export default AddListDropdownContainer

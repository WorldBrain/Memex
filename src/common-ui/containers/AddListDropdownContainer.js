import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { updateLastActive } from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    IndexDropdownNewRow,
    IndexDropdown,
    IndexDropdownRow,
} from '../components'

class DropdownContainer extends Component {
    static propTypes = {
        onFilterAdd: PropTypes.func,
        onFilterDel: PropTypes.func,
        results: PropTypes.array.isRequired,
        initSuggestions: PropTypes.array,
        bulkAddPagesToList: PropTypes.func,
        bulkRemovePagesFromList: PropTypes.func,
        applyBulkEdits: PropTypes.func,
        resetPagesinTempList: PropTypes.func,
        setTempLists: PropTypes.func,
        mode: PropTypes.string.isRequired,
        url: PropTypes.string,
        onBackBtnClick: PropTypes.func,
    }

    static defaultProps = {
        onFilterAdd: noop,
        onFilterDel: noop,
        results: [],
        displayFilters: [],
    }

    constructor(props) {
        super(props)

        this.fetchListSuggestions = debounce(300)(this.fetchListSuggestions)
        this.addList = remoteFunction('createCustomList')
        this.addUrlToList = remoteFunction('insertPageToList')
        this.deleteUrlFromList = remoteFunction('removePageFromList')
        this.fetchListById = remoteFunction('fetchListById')
        this.fetchListNameSuggestions = remoteFunction(
            'fetchListNameSuggestions',
        )

        this.state = {
            searchVal: '',
            isLoading: false,
            displayFilters: props.initSuggestions
                ? props.initSuggestions
                : props.results, // Display state objects; will change all the time
            filters: props.results, // Actual lists associated with the page; will only change when DB updates
            focused: props.results.length ? 0 : -1,
        }
    }

    componentWillMount() {
        // The temporary list array gets updated.
        if (this.overviewMode) {
            this.props.setTempLists()
        }
    }

    componentDidUpdate(prevProps) {
        // Checking for results' length is better as component updates only
        // when a list is added or deleted, which implies that the length of
        // props.results will differ across two updates.
        if (
            prevProps.results !== undefined &&
            this.props.results !== undefined &&
            prevProps.results.length !== this.props.results.length
        ) {
            /* eslint-disable-next-line react/no-did-update-set-state */
            this.setState({
                displayFilters: this.props.initSuggestions
                    ? this.props.initSuggestions
                    : this.props.results,
                filters: this.props.results,
            })
            /* eslint-enable */
        }
    }

    get allowIndexUpdate() {
        return this.props.url != null
    }

    get overviewMode() {
        return this.props.mode === 'overview'
    }

    scrollElementIntoViewIfNeeded(domNode) {
        // const parentNode = domNode.parentNode
        // parentNode.scrollTop = domNode.offsetTop - parentNode.offsetTop
        domNode.scrollIntoView({ behaviour: 'smooth', block: 'nearest' })
        // Gives error in FF.
        // domNode.scrollIntoViewIfNeeded()
    }

    setInputRef = el => (this.inputEl = el)

    canCreateList() {
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

    addPageToList = () => {}

    createList = async () => {
        const listName = this.getSearchVal()

        if (this.allowIndexUpdate) {
            try {
                // Add a list as well as add this page to the list.
                const id = await this.addList({ name: listName })
                await this.addUrlToList({ id, url: this.props.url })

                // Get the list that was added.
                const newList = await this.fetchListById({ id })

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
    getDisplayLists = () =>
        this.state.displayFilters.map((value, i) => ({
            value,
            active: value.active,
            focused: this.state.focused === i,
        }))

    getSearchVal = () => this.state.searchVal.trim().replace(/\s\s+/g, ' ')

    fetchListSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        try {
            suggestions = await this.fetchListNameSuggestions({
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

    handleSearchEnterPress(event) {
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

    handleListClick = index => async event => {
        const list = this.state.displayFilters[index]
        const pageBelongsToList = !(
            this.state.filters.findIndex(val => val.id === list.id) === -1
        )

        // Either add or remove the list, let Redux handle the store changes.
        if (!pageBelongsToList) {
            if (this.allowIndexUpdate) {
                this.addUrlToList({
                    id: list.id,
                    url: this.props.url,
                }).catch(console.error)
            }

            this.props.onFilterAdd(list)
        } else {
            if (this.allowIndexUpdate) {
                this.deleteUrlFromList({
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

    handleSearchArrowPress(event) {
        event.preventDefault()

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

    handleSearchKeyDown = event => {
        switch (event.key) {
            case 'Enter':
                return this.handleSearchEnterPress(event)
            case 'ArrowUp':
            case 'ArrowDown':
                return this.handleSearchArrowPress(event)
        }
    }

    handleSearchChange = event => {
        const searchVal = event.target.value

        const displayFilters = !searchVal.length
            ? this.props.initSuggestions
                ? this.props.initSuggestions
                : this.props.results
            : this.state.displayFilters

        this.setState(
            state => ({ ...state, searchVal, displayFilters }),
            this.fetchListSuggestions, // Debounced suggestion fetch
        )
    }

    renderLists() {
        const lists = this.getDisplayLists()

        const listOptions = lists.map((list, i) => (
            <IndexDropdownRow
                {...list}
                key={i}
                onClick={this.handleListClick(i)}
                scrollIntoView={this.scrollElementIntoViewIfNeeded}
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

export default DropdownContainer

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { updateLastActive } from 'src/analytics'
import { AddListDropdownRow, AddListDropdown } from '../components'

class DropdownContainer extends Component {
    static propTypes = {
        onFilterDel: PropTypes.func,
        results: PropTypes.array.isRequired,
        bulkAddPagesToList: PropTypes.func,
        bulkRemovePagesFromList: PropTypes.func,
        applyBulkEdits: PropTypes.func,
        resetPagesinTempList: PropTypes.func,
        setTempLists: PropTypes.func,
        mode: PropTypes.string.isRequired,
    }

    static defaultProps = {
        onFilterAdd: noop,
        onFilterDel: noop,
        results: [],
    }

    constructor(props) {
        super(props)

        this.fetchListSuggestions = debounce(300)(this.fetchListSuggestions)

        this.state = {
            searchVal: '',
            isLoading: false,
            displayFilters: props.results, // Display state objects; will change all the time
            filters: props.results, // Actual lists associated with the page; will only change when DB updates
            focused: props.results.length ? 0 : -1,
        }
    }

    componentWillMount() {
        // The temporary list array gets updated.
        if (this.overviewMode()) this.props.setTempLists()
    }

    get inputBlockPattern() {
        return /[^\w\s-]/gi
    }

    overviewMode() {
        return this.props.mode === 'overview'
    }

    setInputRef = el => (this.inputEl = el)

    /**
     * Selector for derived display lists state
     */
    getDisplayLists = () =>
        this.state.displayFilters.map((value, i) => ({
            value,
            focused: this.state.focused === i,
        }))

    getSearchVal = () =>
        this.state.searchVal
            .trim()
            .replace(/\s\s+/g, ' ')
            .toLowerCase()

    // Temporary suggestion function.
    suggest = searchKey =>
        this.state.filters.filter(obj =>
            obj.name.toLowerCase().includes(searchKey),
        )

    fetchListSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        suggestions = this.suggest(searchVal)
        this.setState(state => ({
            ...state,
            displayFilters: suggestions,
            focused: 0,
        }))
    }

    // TODO: Needs a lot of work
    // Changes state from all -> none -> all| none -> all -> none| some -> none -> all -> some
    handleListSelection = index => async event => {
        const listId = this.getDisplayLists()[index].value._id
        const { filters } = this.state
        const listIndex = filters.findIndex(val => val._id === listId)
        const list = filters[listIndex]
        const { listUrlState } = list
        let { newurlState } = list

        if (listUrlState === 'some' && !newurlState) newurlState = 'none'
        else if (listUrlState === 'none' && !newurlState) newurlState = 'all'
        else if (listUrlState === 'all' && !newurlState) newurlState = 'none'
        else if (listUrlState === 'some' && newurlState === 'all')
            newurlState = 'some'
        else if (newurlState === 'all') newurlState = 'none'
        else if (newurlState === 'none') newurlState = 'all'
        else if (newurlState === 'some') newurlState = 'none'

        // TODO: dispatch actions to temporary change the state unless apply is hit.
        switch (newurlState) {
            case 'all':
                this.props.bulkAddPagesToList(listId)
                break
            case 'none':
                this.props.bulkRemovePagesFromList(listId)
                break
            case 'some':
                this.props.resetPagesinTempList(listId)
                break
        }

        this.setState(state => ({
            ...state,
            filters: [
                ...filters.slice(0, listIndex),
                {
                    ...list,
                    newurlState,
                },
                ...filters.slice(listIndex + 1),
            ],
            displayFilters: [
                ...this.state.displayFilters.slice(0, index),
                {
                    ...this.state.displayFilters[index],
                    listUrlState: newurlState,
                },
                ...this.state.displayFilters.slice(index + 1),
            ],
            focused: index,
        }))
        updateLastActive()
    }

    handleSearchEnterPress(event) {
        event.preventDefault()

        if (this.state.displayFilters.length) {
            return this.handleListSelection(this.state.focused)(event)
        }

        return null
    }

    handleSearchArrowPress(event) {
        event.preventDefault()
        let offset = 0

        if (!this.allowIndexUpdate) offset = 1

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

        if (this.inputBlockPattern.test(searchVal)) {
            return
        }

        const displayFilters = !searchVal.length
            ? this.state.filters
            : this.state.displayFilters

        this.setState(
            state => ({ ...state, searchVal, displayFilters }),
            this.fetchListSuggestions, // Debounced suggestion fetch
        )
    }

    renderLists() {
        const lists = this.getDisplayLists()

        const listOptions = lists.map((list, i) => (
            <AddListDropdownRow
                {...list}
                key={i}
                handleClick={this.handleListSelection(i)}
            />
        ))

        return listOptions
    }

    render() {
        return (
            <AddListDropdown
                onListSearchChange={this.handleSearchChange}
                onListSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                listSearchValue={this.state.searchVal}
                overviewMode={this.overviewMode()}
                {...this.props}
            >
                {this.renderLists()}
            </AddListDropdown>
        )
    }
}

export default DropdownContainer

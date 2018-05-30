import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { updateLastActive } from 'src/analytics'
import Dropdown from './Dropdown'
import DropdownRow from './DropdownRow'

class DropdownContainer extends Component {
    static propTypes = {
        // Opt. cb to run when new tag added to state
        onFilterAdd: PropTypes.func,

        // Opt. cb to run when tag deleted from state
        onFilterDel: PropTypes.func,
        results: PropTypes.array.isRequired,
    }

    static defaultProps = {
        onFilterAdd: noop,
        onFilterDel: noop,
        initFilters: [],
    }

    constructor(props) {
        super(props)

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)

        this.state = {
            searchVal: '',
            isLoading: false,
            displayFilters: props.results, // Display state objects; will change all the time
            filters: props.results, // Actual tags associated with the page; will only change when DB updates
            focused: props.results.length ? 0 : -1,
        }
    }

    /**
     * Domain inputs need to allow '.' while tags shouldn't.
     */
    get inputBlockPattern() {
        return /[^\w\s-]/gi
    }

    setInputRef = el => (this.inputEl = el)

    /**
     * Selector for derived display tags state
     */
    getDisplayTags = () =>
        this.state.displayFilters.map((value, i) => ({
            value,
            // TODO: active = state all/none/some
            active: this.isPageTag(value),
            focused: this.state.focused === i,
        }))

    isPageTag = () => {}

    /**
     * Selector for derived search value/new tag input state
     */
    getSearchVal = () =>
        this.state.searchVal
            .trim()
            .replace(/\s\s+/g, ' ')
            .toLowerCase()

    canCreateTag() {
        if (!this.allowIndexUpdate) {
            return false
        }

        const searchVal = this.getSearchVal()

        return (
            !!searchVal.length &&
            !this.state.displayFilters.reduce(
                (acc, tag) => acc || tag === searchVal,
                false,
            )
        )
    }

    fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        try {
            // TODO: write a suggestion function, just string matching
            suggestions = []
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                displayFilters: suggestions,
                focused: 0,
            }))
        }
    }

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    // TODO: Needs a lot of work
    // Changes state from all -> none -> all| none -> all -> none| some -> none -> all -> some
    handleTagSelection = index => async event => {
        const listId = this.getDisplayTags()[index].value._id
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
            return this.handleTagSelection(this.state.focused)(event)
        }

        return null
    }

    handleSearchArrowPress(event) {
        event.preventDefault()

        // One extra index if the "add new tag" thing is showing
        let offset = this.canCreateTag() ? 0 : 1

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

        // Block input of non-words, spaces and hypens for tags
        if (this.inputBlockPattern.test(searchVal)) {
            return
        }

        // If user backspaces to clear input, show the current assoc tags again
        const displayFilters = !searchVal.length
            ? this.state.filters
            : this.state.displayFilters

        this.setState(
            state => ({ ...state, searchVal, displayFilters }),
            this.fetchTagSuggestions, // Debounced suggestion fetch
        )
    }

    renderTags() {
        const tags = this.getDisplayTags()

        const tagOptions = tags.map((list, i) => (
            <DropdownRow
                {...list}
                key={i}
                handleClick={this.handleTagSelection(i)}
            />
        ))

        return tagOptions
    }

    render() {
        return (
            <Dropdown
                onTagSearchChange={this.handleSearchChange}
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={this.state.filters.length}
                tagSearchValue={this.state.searchVal}
                {...this.props}
            >
                {this.renderTags()}
            </Dropdown>
        )
    }
}

export default DropdownContainer

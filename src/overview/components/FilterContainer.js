import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Tags, TagRow } from 'src/common-ui/components'

class FilterContainer extends Component {
    static propTypes = {
        // Opt. cb to run when new tag added to state
        onFilterAdd: PropTypes.func,

        // Opt. cb to run when tag deleted from state
        onFilterDel: PropTypes.func,

        // Tag Filters that are previously present in the location
        initFilters: PropTypes.arrayOf(PropTypes.string),
        tag: PropTypes.bool,
    }

    static defaultProps = {
        onFilterAdd: noop,
        onFilterDel: noop,
    }

    constructor(props) {
        super(props)

        this.suggest = remoteFunction('suggest')

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)
    }

    state = {
        searchVal: '',
        isLoading: false,
        displayFilters: this.props.initFilters,
        focused: -1,
        initFilters: this.props.initFilters,
    }

    componentWillReceiveProps(props) {
        this.setState(state => ({
            ...state,
            initFilters: props.initFilters,
            displayFilters: props.initFilters,
        }))
    }

    isPageTag = value => {
        return this.props.initFilters.includes(value)
    }

    setInputRef = el => (this.inputEl = el)

    /**
     * Selector for derived display tags state
     */
    getDisplayTags = tags =>
        this.state.displayFilters.map((value, i) => ({
            value,
            active: this.isPageTag(value),
            focused: this.state.focused === i,
        }))

    /**
     * Selector for derived search value/new tag input state
     */
    getSearchVal = () =>
        this.state.searchVal
            .trim()
            .replace(/\s\s+/g, ' ')
            .toLowerCase()

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    handleTagSelection = index => async event => {
        const tag = this.getDisplayTags()[index].value
        const tagIndex = this.state.initFilters.findIndex(val => val === tag)

        try {
            if (tagIndex === -1) {
                this.props.onFilterAdd(tag)
            } else {
                this.props.onFilterDel(tag)
            }
        } catch (err) {
        } finally {
            this.inputEl.focus()
            this.setState(state => ({
                ...state,
                focused: 0,
                searchVal: '',
            }))
        }
    }

    handleSearchEnterPress(event) {
        event.preventDefault()
        const tagSearchValue = this.getSearchVal()
        if (tagSearchValue.length !== 0) {
            return this.handleTagSelection(this.state.focused)(event)
        }
        return null
    }

    handleSearchArrowPress(event) {
        event.preventDefault()
        const options = this.state.displayFilters.length
            ? this.state.displayFilters
            : this.state.initFilters

        // Calculate the next focused index depending on current focus and direction
        let focusedReducer
        if (event.key === 'ArrowUp') {
            focusedReducer = focused =>
                focused < 1 ? options.length - 1 : focused - 1
        } else {
            focusedReducer = focused =>
                focused === options.length - 1 ? 0 : focused + 1
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

        // Block input of non-words, spaces and hypens
        if (/[^\w\s-]/gi.test(searchVal)) {
            return
        }

        // If user backspaces to clear input, show the current assoc tags again
        const displayFilters = !searchVal.length
            ? this.state.initFilters
            : this.state.displayFilters

        this.setState(
            state => ({ ...state, searchVal, displayFilters }),
            this.fetchTagSuggestions, // Debounced suggestion fetfh
        )
    }

    fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.displayFilters

        try {
            suggestions = await this.suggest(
                searchVal,
                this.props.tag ? 'tag' : 'domain',
            )
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                displayFilters: suggestions,
                focused: 0,
            }))
        }
    }

    renderTags() {
        const tags = this.getDisplayTags()

        const tagOptions = tags.map((tag, i) => (
            <TagRow {...tag} key={i} onClick={this.handleTagSelection(i)} />
        ))

        return tagOptions
    }

    render() {
        return (
            <Tags
                onTagSearchChange={this.handleSearchChange}
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={this.state.initFilters.length}
                tagSearchValue={this.state.searchVal}
                {...this.props}
            >
                {this.renderTags()}
            </Tags>
        )
    }
}

export default FilterContainer

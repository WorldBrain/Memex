import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { updateLastActive } from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import {
    IndexDropdown,
    IndexDropdownNewRow,
    IndexDropdownRow,
} from '../components'

class IndexDropdownContainer extends Component {
    static propTypes = {
        // The URL to use for dis/associating new tags with; set this to keep in sync with index
        url: PropTypes.string,

        // Opt. cb to run when new tag added to state
        onFilterAdd: PropTypes.func,

        // Opt. cb to run when tag deleted from state
        onFilterDel: PropTypes.func,

        // Tag Filters that are previously present in the location
        initFilters: PropTypes.arrayOf(PropTypes.string),

        source: PropTypes.oneOf(['tag', 'domain']).isRequired,
    }

    static defaultProps = {
        onFilterAdd: noop,
        onFilterDel: noop,
        initFilters: [],
    }

    constructor(props) {
        super(props)

        this.suggest = remoteFunction('suggest')
        this.addTags = remoteFunction('addTags')
        this.delTags = remoteFunction('delTags')

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)

        this.state = {
            searchVal: '',
            isLoading: false,
            displayFilters: props.initFilters, // Display state objects; will change all the time
            filters: props.initFilters, // Actual tags associated with the page; will only change when DB updates
            focused: props.initFilters.length ? 0 : -1,
        }
    }

    /**
     * Domain inputs need to allow '.' while tags shouldn't.
     */
    get inputBlockPattern() {
        return this.props.source === 'domain' ? /[^\w\s-.]/gi : /[^\w\s-]/gi
    }

    /**
     * Decides whether or not to allow index update. Currently determined by `props.url` setting.
     */
    get allowIndexUpdate() {
        return this.props.url != null
    }

    isPageTag = value => this.state.filters.includes(value)

    setInputRef = el => (this.inputEl = el)

    /**
     * Selector for derived display tags state
     */
    getDisplayTags = () =>
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

    /**
     * Used for 'Enter' presses or 'Add new tag' clicks.
     */
    addTag = async () => {
        const newTag = this.getSearchVal()
        let newTags = this.state.filters

        try {
            if (this.allowIndexUpdate) {
                await this.addTags({ url: this.props.url }, [newTag])
            }
            newTags = [newTag, ...this.state.filters]
        } catch (err) {
        } finally {
            this.inputEl.focus()
            this.setState(state => ({
                ...state,
                searchVal: '',
                filters: newTags,
                displayFilters: newTags,
                focused: 0,
            }))
            this.props.onFilterAdd(newTag)
            updateLastActive() // Consider user active (analytics)
        }
    }

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    handleTagSelection = index => async event => {
        const tag = this.getDisplayTags()[index].value
        const tagIndex = this.state.filters.findIndex(val => val === tag)

        let tagsReducer = tags => tags
        // Either add or remove it to the main `state.tags` array
        try {
            if (tagIndex === -1) {
                if (this.allowIndexUpdate) {
                    await this.addTags({ url: this.props.url }, [tag])
                }
                this.props.onFilterAdd(tag)
                tagsReducer = tags => [tag, ...tags]
            } else {
                if (this.allowIndexUpdate) {
                    await this.delTags({ url: this.props.url }, [tag])
                }
                this.props.onFilterDel(tag)
                tagsReducer = tags => [
                    ...tags.slice(0, tagIndex),
                    ...tags.slice(tagIndex + 1),
                ]
            }
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                filters: tagsReducer(state.filters),
                focused: index,
            }))
            updateLastActive() // Consider user active (analytics)
        }
    }

    handleSearchEnterPress(event) {
        event.preventDefault()

        if (
            this.canCreateTag() &&
            this.state.focused === this.state.displayFilters.length
        ) {
            return this.addTag()
        }

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

    fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        try {
            suggestions = await this.suggest(searchVal, this.props.source)
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
            <IndexDropdownRow
                {...tag}
                key={i}
                onClick={this.handleTagSelection(i)}
            />
        ))

        if (this.canCreateTag()) {
            tagOptions.push(
                <IndexDropdownNewRow
                    key="+"
                    value={this.state.searchVal}
                    onClick={this.addTag}
                    focused={
                        this.state.focused === this.state.displayFilters.length
                    }
                />,
            )
        }

        return tagOptions
    }

    render() {
        return (
            <IndexDropdown
                onTagSearchChange={this.handleSearchChange}
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={this.state.filters.length}
                tagSearchValue={this.state.searchVal}
                {...this.props}
            >
                {this.renderTags()}
            </IndexDropdown>
        )
    }
}

export default IndexDropdownContainer

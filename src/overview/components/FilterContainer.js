import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Tags, TagRow } from 'src/common-ui/components'

class FilterContainer extends Component {
    static propTypes = {
        // Opt. cb to run when new tag added to state
        onTagAdd: PropTypes.func,

        // Opt. cb to run when tag deleted from state
        onTagDel: PropTypes.func,

        // Opt. cb to run when new domain added to state
        onDomainAdd: PropTypes.func,

        // Opt. cb to run when domain deleted from state
        onDomainDel: PropTypes.func,

        // Tag Filters that are previously present in the location
        tagInputs: PropTypes.arrayOf(PropTypes.string),

        // Domain Filters that are previously present in the location
        domainInputs: PropTypes.arrayOf(PropTypes.string),
        tag: PropTypes.bool,
    }

    static defaultProps = {
        onTagAdd: noop,
        onTagDel: noop,
        onDomainAdd: noop,
        onDomainDel: noop,
    }

    constructor(props) {
        super(props)

        this.suggestTags = remoteFunction('suggestTags')
        this.suggestDomains = remoteFunction('suggestDomains')

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)
    }

    state = {
        searchVal: '',
        isLoading: false,
        displayTags: this.props.tag
            ? this.props.tagInputs
            : this.props.domainInputs, // Display state objects; will change all the time
        focused: -1,
        tagInputs: this.props.tagInputs,
        domainInputs: this.props.domainInputs,
    }

    componentWillReceiveProps(props) {
        this.setState(state => ({
            ...state,
            tagInputs: props.tagInputs,
            domainInputs: props.domainInputs,
            displayTags: props.tag ? props.tagInputs : props.domainInputs,
        }))
    }

    isPageTag = value => {
        return this.props.tag
            ? this.state.tagInputs.includes(value)
            : this.state.domainInputs.includes(value)
    }

    setInputRef = el => (this.inputEl = el)

    /**
     * Selector for derived display tags state
     */
    getDisplayTags = tags =>
        this.state.displayTags.map((value, i) => ({
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
        const tagIndex = this.props.tag
            ? this.state.tagInputs.findIndex(val => val === tag)
            : this.state.domainInputs.findIndex(val => val === tag)

        try {
            if (tagIndex === -1) {
                if (this.props.tag) {
                    this.props.onTagAdd(tag)
                } else {
                    this.props.onDomainAdd(tag)
                }
            } else {
                if (this.props.tag) {
                    this.props.onTagDel(tag)
                } else {
                    this.props.onDomainDel(tag)
                }
            }
        } catch (err) {
        } finally {
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
        const options = this.state.displayTags.length
            ? this.state.displayTags
            : this.props.tag ? this.state.tagInputs : this.state.domainInputs

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
        const displayTags = !searchVal.length
            ? this.props.tag ? this.state.tagInputs : this.state.domainInputs
            : this.state.displayTags

        this.setState(
            state => ({ ...state, searchVal, displayTags }),
            this.fetchTagSuggestions, // Debounced suggestion fetfh
        )
    }

    fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.displayTags

        try {
            suggestions = this.props.tag
                ? await this.suggestTags(searchVal)
                : await this.suggestDomains(searchVal)
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                displayTags: suggestions,
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
                numberOfTags={
                    this.props.tag
                        ? this.state.tagInputs.length
                        : this.state.domainInputs.length
                }
                tagSearchValue={this.state.searchVal}
                {...this.props}
            >
                {this.renderTags()}
            </Tags>
        )
    }
}

export default FilterContainer

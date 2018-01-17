import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from 'src/util/webextensionRPC'
import { Tags, NewTagRow, TagRow } from '../components'

class TagsContainer extends Component {
    static propTypes = {
        // The URL to use for dis/associating new tags with
        url: PropTypes.string.isRequired,

        // Opt. cb to run when new tag added to DB
        onTagAdd: PropTypes.func,

        // Opt. cb to run when tag deleted from DB
        onTagDel: PropTypes.func,
    }

    static defaultProps = {
        onTagAdd: noop,
        onTagDel: noop,
    }

    constructor(props) {
        super(props)

        this.suggestTags = remoteFunction('suggestTags')
        this.fetchTags = remoteFunction('fetchTags')
        this.addTags = remoteFunction('addTags')
        this.delTags = remoteFunction('delTags')

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)
    }

    state = {
        searchVal: '',
        isLoading: false,
        displayTags: [], // Display state objects; will change all the time
        tags: [], // Actual tags associated with the page; will only change when DB updates
    }

    componentDidMount() {
        this.fetchInitTags()
    }

    isPageTag = value => this.state.tags.includes(value)

    setInputRef = el => (this.inputEl = el)

    async fetchInitTags() {
        this.setState(state => ({ ...state, isLoading: true }))

        let tags = []
        try {
            tags = await this.fetchTags({ url: this.props.url })
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                isLoading: false,
                tags,
                displayTags: tags,
            }))
        }
    }

    /**
     * Selector for derived display tags state
     */
    getDisplayTags = () =>
        this.state.displayTags.map(value => ({
            value,
            active: this.isPageTag(value),
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
        const searchVal = this.getSearchVal()

        return (
            !!searchVal.length &&
            !this.state.tags.reduce(
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
        let newTags = this.state.tags

        try {
            await this.addTags({ url: this.props.url }, [newTag])
            newTags = [newTag, ...this.state.tags]
        } catch (err) {
        } finally {
            this.inputEl.focus()
            this.setState(state => ({
                ...state,
                searchVal: '',
                tags: newTags,
                displayTags: newTags,
            }))
            this.props.onTagAdd(newTag)
        }
    }

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    handleTagSelection = index => async event => {
        const tag = this.getDisplayTags()[index].value
        const tagIndex = this.state.tags.findIndex(val => val === tag)

        let tagsReducer = tags => tags
        // Either add or remove it to the main `state.tags` array
        try {
            if (tagIndex === -1) {
                await this.addTags({ url: this.props.url }, [tag])
                this.props.onTagAdd(tag)
                tagsReducer = tags => [tag, ...tags]
            } else {
                await this.delTags({ url: this.props.url }, [tag])
                this.props.onTagDel(tag)
                tagsReducer = tags => [
                    ...tags.slice(0, tagIndex),
                    ...tags.slice(tagIndex + 1),
                ]
            }
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                tags: tagsReducer(state.tags),
            }))
        }
    }

    handleSearchEnterPress(event) {
        event.preventDefault()

        if (this.canCreateTag()) {
            this.addTag()
        }
    }

    handleSearchKeyDown = event => {
        switch (event.key) {
            case 'Enter':
                return this.handleSearchEnterPress(event)
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
            ? this.state.tags
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

        let suggestions = this.state.tags

        try {
            suggestions = await this.suggestTags(searchVal)
        } catch (err) {
        } finally {
            this.setState(state => ({
                ...state,
                displayTags: suggestions,
            }))
        }
    }

    renderTags() {
        const tags = this.getDisplayTags()

        const tagOptions = tags.map((tag, i) => (
            <TagRow {...tag} key={i} onClick={this.handleTagSelection(i)} />
        ))

        if (this.canCreateTag()) {
            tagOptions.push(
                <NewTagRow
                    key="+"
                    value={this.state.searchVal}
                    onClick={this.addTag}
                />,
            )
        }

        return tagOptions
    }

    render() {
        return (
            <Tags
                onTagSearchChange={this.handleSearchChange}
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={this.state.tags.length}
                tagSearchValue={this.state.searchVal}
                {...this.props}
            >
                {this.renderTags()}
            </Tags>
        )
    }
}

export default TagsContainer

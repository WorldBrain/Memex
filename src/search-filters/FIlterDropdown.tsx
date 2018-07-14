import React, { Component } from 'react'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import internalAnalytics from '../analytics/internal'
import { updateLastActive } from '../analytics'
import { remoteFunction } from '../util/webextensionRPC'
import { IndexDropdown } from '../common-ui/components'

const styles = require('./components/IndexDropdownSB.css')

import {
    selectors as filters,
    actions as filterActs,
} from '../overview/filters'

import { FilteredRow } from './components'
import { isSidebarOpen } from '../overview/sidebar/selectors'

export interface Props {
    source: 'tag' | 'domain'
    hover?: boolean
    initFilters?: string[]
    /** Opt. cb to run when new tag added to state. */
    onFilterAdd?: (filter: string) => void
    /** Opt. cb to run when tag deleted from state. */
    onFilterDel?: (filter: string) => void
    // initial suggestions from the popup
    initSuggestions?: string[]
    filteredTags?: string[]
    filteredDomains?: string[]
    isSidebarOpen: boolean
    onClose?: () => void
}

export interface State {
    searchVal: string
    isLoading: boolean
    results: string[]
    focused: number
}

class IndexDropdownContainer extends Component<Props, State> {
    static defaultProps: Partial<Props> = {
        onFilterAdd: noop,
        onFilterDel: noop,
        initFilters: [],
    }

    private suggestRPC
    private inputEl: HTMLInputElement

    constructor(props: Props) {
        super(props)

        this.suggestRPC = remoteFunction('suggest')

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)

        this.state = {
            searchVal: '',
            isLoading: false,
            results: props.initFilters, // Actual tags associated with the page; will only change when DB updates
            focused: props.initFilters.length ? 0 : -1,
        }
    }

    /**
     * Domain inputs need to allow '.' while tags shouldn't.
     */
    private get inputBlockPattern() {
        return this.props.source === 'domain' ? /[^\w\s-.]/gi : /[^\w\s-]/gi
    }

    /**
     * will always contain the applied tag/domain filter
     *
     * @readonly
     * @private
     * @memberof IndexDropdownContainer
     */
    private get filters() {
        return this.props.source === 'domain'
            ? this.props.filteredDomains
            : this.props.filteredTags
    }

    /**
     * Selector for derived display tags state
     */
    private getDisplayElements() {
        return this.state.results.map((value, i) => ({
            value,
            active: this.pageHasTag(value),
            focused: this.state.focused === i,
        }))
    }

    private pageHasTag = (value: string) => this.filters.includes(value)
    private setInputRef = (el: HTMLInputElement) => (this.inputEl = el)

    /**
     * Selector for derived search value/new tag input state
     */
    private getSearchVal() {
        return this.state.searchVal
            .trim()
            .replace(/\s\s+/g, ' ')
            .toLowerCase()
    }

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    private handleTagSelection = (index: number) => async event => {
        const tag = this.getDisplayElements()[index].value
        const tagIndex = this.filters.findIndex(val => val === tag)

        // Either add or remove it to the main `state.tags` array
        if (tagIndex === -1) {
            this.props.onFilterAdd(tag)
        } else {
            this.props.onFilterDel(tag)
        }

        this.setState(state => ({
            ...state,
            focused: index,
        }))

        updateLastActive() // Consider user active (analytics)
    }

    private handleSearchEnterPress(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        event.preventDefault()

        if (this.state.results.length) {
            return this.handleTagSelection(this.state.focused)(event)
        }

        return null
    }

    private handleSearchArrowPress(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        event.preventDefault()

        const offset = 1
        // Calculate the next focused index depending on current focus and direction
        let focusedReducer
        if (event.key === 'ArrowUp') {
            focusedReducer = focused =>
                focused < 1 ? this.state.results.length - offset : focused - 1
        } else {
            focusedReducer = focused =>
                focused === this.state.results.length - offset ? 0 : focused + 1
        }

        this.setState(state => ({
            ...state,
            focused: focusedReducer(state.focused),
        }))
    }

    handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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

        // Block input of non-words, spaces and hypens for tags
        if (this.inputBlockPattern.test(searchVal)) {
            return
        }

        // If user backspaces to clear input, show the current assoc tags again
        const results = !searchVal.length ? this.filters : this.state.results

        this.setState(
            state => ({ ...state, searchVal, results }),
            this.fetchTagSuggestions, // Debounced suggestion fetch
        )
    }

    private fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.results

        try {
            suggestions = await this.suggestRPC(searchVal, this.props.source)
        } catch (err) {
            console.error(err)
        } finally {
            this.setState(state => ({
                ...state,
                results: suggestions,
                focused: 0,
            }))
        }
    }

    private renderTags() {
        const tags = this.getDisplayElements()

        const tagOptions = tags.map((tag, i) => (
            <FilteredRow
                {...tag}
                key={i}
                onClick={this.handleTagSelection(i)}
            />
        ))
        return tagOptions
    }

    render() {
        return (
            <div className={styles.container}>
                <IndexDropdown
                    onTagSearchChange={this.handleSearchChange}
                    onTagSearchKeyDown={this.handleSearchKeyDown}
                    setInputRef={this.setInputRef}
                    numberOfTags={this.state.results.length}
                    tagSearchValue={this.state.searchVal}
                    {...this.props}
                >
                    {this.renderTags()}
                </IndexDropdown>
            </div>
        )
    }
}

const mapStateToProps = (state): Partial<Props> => ({
    filteredTags: filters.tags(state),
    filteredDomains: filters.displayDomains(state),
})

export default connect(
    mapStateToProps,
    null,
)(IndexDropdownContainer)

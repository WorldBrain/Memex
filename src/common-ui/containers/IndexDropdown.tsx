import React, { Component } from 'react'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from 'src/util/webextensionRPC'
import {
    IndexDropdown,
    IndexDropdownNewRow,
    IndexDropdownRow,
} from '../components'
import { ClickHandler } from 'src/popup/types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'
import * as Raven from 'src/util/raven'

export interface Props {
    env?: 'inpage' | 'overview'
    source: 'tag' | 'domain' | 'user' | 'hashtag'
    /** The URL to use for dis/associating new tags with; set this to keep in sync with index. */
    url?: string
    hover?: boolean
    tabId?: number
    /** Whether the tags are for annotations */
    isForAnnotation?: boolean
    /** Manual flag to display "Add tag" without creating a tag */
    allowAdd?: boolean
    /** Tag Filters that are previously present in the location. */
    initFilters?: any[]
    initExcFilters?: any[]
    /** Opt. cb to run when new tag added to state. */
    onFilterAdd?: (filter: any) => void
    /** Opt. cb to run when tag deleted from state. */
    onFilterDel?: (filter: any) => void
    /** Opt. cb to run when new tag added to state. */
    onExcFilterAdd?: (filter: any) => void
    /** Opt. cb to run when tag deleted from state. */
    onExcFilterDel?: (filter: any) => void
    /** Opt. cb with new tag to be added to a new annotation */
    onNewTagAdd?: (filter: string) => void
    setTagDivRef?: (el: HTMLDivElement) => void
    /** initial suggestions from the popup */
    initSuggestions?: any[]
    isForSidebar?: boolean
    isForRibbon?: boolean
    onBackBtnClick?: ClickHandler<HTMLButtonElement>
    allTabs?: boolean
    /** Add tags from dashboard */
    fromOverview?: boolean
    isSocialPost?: boolean
    sidebarTagDiv?: boolean
    onTagClickCb?: () => void
}

export interface State {
    showError: boolean
    errMsg: string
    searchVal: string
    isLoading: boolean
    displayFilters: any[]
    filters: any[]
    focused: number
    clearFieldBtn: boolean
    multiEdit: Set<string>
    excFilters: any[]
}

class IndexDropdownContainer extends Component<Props, State> {
    static defaultProps: Partial<Props> = {
        onFilterAdd: noop,
        onFilterDel: noop,
        onExcFilterAdd: noop,
        onExcFilterDel: noop,
        initFilters: [],
        initExcFilters: [],
        isForAnnotation: false,
        isForRibbon: false,
        fromOverview: false,
        onTagClickCb: noop,
    }

    private err: { timestamp: number; err: Error }
    private suggestRPC
    private delTagRPC
    private addTagsToOpenTabsRPC
    private delTagsFromOpenTabsRPC
    private inputEl: HTMLInputElement
    private fetchUserSuggestionsRPC
    private fetchHashtagSuggestionsRPC

    constructor(props: Props) {
        super(props)

        this.suggestRPC = remoteFunction('suggest')
        this.delTagRPC = remoteFunction(this.delTagRPCName)
        this.addTagsToOpenTabsRPC = remoteFunction('addTagsToOpenTabs')
        this.delTagsFromOpenTabsRPC = remoteFunction('delTagsFromOpenTabs')
        this.fetchUserSuggestionsRPC = remoteFunction('fetchUserSuggestions')
        this.fetchHashtagSuggestionsRPC = remoteFunction(
            'fetchHashtagSuggestions',
        )

        this.fetchTagSuggestions = debounce(300)(this.fetchTagSuggestions)

        this.state = {
            errMsg: '',
            searchVal: '',
            isLoading: false,
            showError: false,
            displayFilters: props.initSuggestions
                ? props.initSuggestions
                : props.initFilters, // Display state objects; will change all the time
            filters: props.initFilters, // Actual tags associated with the page; will only change when DB updates
            focused: -1,
            clearFieldBtn: false,
            multiEdit: new Set<string>(),
            excFilters: props.initExcFilters,
        }
    }

    componentWillUnmount() {
        if (this.err && Date.now() - this.err.timestamp <= 1000) {
            handleDBQuotaErrors(
                (err) =>
                    notifications.create({
                        requireInteraction: false,
                        title: 'Memex error: tag adding',
                        message: err.message,
                    }),
                () => remoteFunction('dispatchNotification')('db_error'),
            )(this.err.err)
        }
    }

    componentDidUpdate(prevProps: Props) {
        // Checking for initFilters' length is better as component updates only
        // when a filter is added or deleted, which implies that the length of
        // props.initFilters will differ across two updates.
        if (
            (prevProps.initFilters !== undefined &&
                this.props.initFilters !== undefined &&
                prevProps.initFilters.length !==
                    this.props.initFilters.length) ||
            (prevProps.initExcFilters !== undefined &&
                this.props.initExcFilters !== undefined &&
                prevProps.initExcFilters.length !==
                    this.props.initExcFilters.length)
        ) {
            this.setState({
                displayFilters: this.props.initSuggestions
                    ? this.props.initSuggestions
                    : [...this.props.initFilters, ...this.props.initExcFilters],
                filters: this.props.initFilters,
                excFilters: this.props.initExcFilters,
            })
        }
    }

    private get delTagRPCName(): string {
        if (this.props.isSocialPost) {
            return 'delTagForTweet'
        }

        if (this.props.isForAnnotation) {
            return 'delAnnotationTag'
        }

        if (this.props.fromOverview) {
            return 'delTag'
        }

        return 'delPageTag'
    }

    /**
     * Decides whether or not to allow index update. Currently determined by `props.url` setting.
     */
    private get allowIndexUpdate() {
        return this.props.url != null
    }

    private showClearfieldBtn() {
        return !this.props.isForSidebar ? false : this.state.clearFieldBtn
    }

    private async storeTrackEvent(isAdded: boolean) {
        const { hover, source } = this.props

        // Make first letter capital
        const sourceType = source.charAt(0).toUpperCase() + source.substr(1)
    }
    /**
     * Selector for derived display tags state
     */
    private getDisplayTags() {
        const filters =
            this.state.searchVal.length > 0
                ? this.state.displayFilters
                : [
                      ...new Set([
                          ...this.state.filters,
                          ...this.state.excFilters,
                          ...this.state.displayFilters,
                      ]),
                  ]

        return filters.map((value, i) => ({
            value,
            active: this.props.allTabs
                ? this.state.multiEdit.has(value)
                : this.pageHasTag(value, true),
            focused: this.state.focused === i,
            excActive: this.pageHasTag(value, false),
        }))
    }

    private pageHasTag = (value: any, inc: boolean) => {
        const filters = inc ? this.state.filters : this.state.excFilters
        return this.props.source === 'user'
            ? filters.find((user) => user.id === value.id) !== undefined
            : filters.includes(value)
    }
    private setInputRef = (el: HTMLInputElement) => (this.inputEl = el)

    /**
     * Selector for derived search value/new tag input state
     */
    private getSearchVal() {
        return this.state.searchVal.trim().replace(/\s\s+/g, ' ').toLowerCase()
    }

    private canCreateTag = () => {
        if (!this.allowIndexUpdate && !this.props.allowAdd) {
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

    private handleError = (err: Error) => {
        Raven.captureException(err)
        this.setState(() => ({ showError: true, errMsg: err.message }))
        this.err = {
            timestamp: Date.now(),
            err,
        }
    }

    private handleExcTagSelection = (index: number) => (event) => {
        const tag =
            this.state.searchVal.length > 0
                ? this.state.displayFilters[index]
                : [
                      ...new Set([
                          ...this.state.filters,
                          ...this.state.excFilters,
                          ...this.state.displayFilters,
                      ]),
                  ][index]

        const pageHasExcTag = this.pageHasTag(tag, false)

        let excFilters = this.state.excFilters
        if (!pageHasExcTag) {
            this.props.onExcFilterAdd(tag)
            excFilters.push(tag)
        } else {
            this.props.onExcFilterDel(tag)
            excFilters =
                this.props.source === 'user'
                    ? excFilters.filter((user) => user.id !== tag.id)
                    : excFilters.filter((a) => a !== tag)
        }

        this.setState({
            excFilters,
            searchVal: '',
            focused: -1,
            clearFieldBtn: false,
        })
    }

    private handleSearchEnterPress = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        return null
    }

    private handleSearchArrowPress = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        event.preventDefault()

        // One extra index if the "add new tag" thing is showing
        let offset = this.canCreateTag() ? 0 : 1

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
        // If user backspaces to clear input, show the list of suggested tags again.
        let displayFilters
        let clearFieldBtn
        if (!searchVal.length) {
            displayFilters = this.props.initSuggestions
                ? this.props.initSuggestions
                : this.props.initFilters
            clearFieldBtn = false
        } else {
            displayFilters = this.state.displayFilters
            clearFieldBtn = true
        }

        this.setState(
            (state) => ({ ...state, searchVal, displayFilters, clearFieldBtn }),
            this.fetchTagSuggestions, // Debounced suggestion fetch
        )
    }

    clearSearchField = () => {
        this.setState((state) => ({
            ...state,
            searchVal: '',
            clearFieldBtn: false,
        }))
    }

    private fetchTagSuggestions = async () => {
        const searchVal = this.getSearchVal()
        if (!searchVal.length) {
            return
        }

        let suggestions = this.state.filters

        try {
            if (this.props.source === 'user') {
                suggestions = await this.fetchUserSuggestionsRPC({
                    name: searchVal,
                    base64Img: this.props.isForRibbon,
                })
            } else if (this.props.source === 'hashtag') {
                suggestions = await this.fetchHashtagSuggestionsRPC({
                    name: searchVal,
                })
            } else {
                suggestions = await this.suggestRPC({
                    query: searchVal,
                    type: this.props.source,
                })
            }
        } catch (err) {
            this.handleError(err)
        } finally {
            this.setState((state) => ({
                ...state,
                displayFilters: suggestions,
                focused: -1,
            }))
        }
    }

    scrollElementIntoViewIfNeeded(domNode: HTMLElement) {
        // Determine if `domNode` fully fits inside `containerDomNode`.
        // If not, set the container's scrollTop appropriately.
        // Below are two ways to do it
        // 1. Element.ScrollIntoView()
        domNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        // 2. Use Element.scrollTop()
        // const parentNode = domNode.parentNode as HTMLElement
        // parentNode.scrollTop = domNode.offsetTop - parentNode.offsetTop
    }

    private renderTags() {
        let tagOptions: React.ReactNode[] = this.getDisplayTags().map(
            (tag, i) => (
                <IndexDropdownRow
                    {...tag}
                    key={i}
                    onExcClick={this.handleExcTagSelection(i)}
                    {...this.props}
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                    isForSidebar={this.props.isForSidebar}
                />
            ),
        )

        if (this.canCreateTag()) {
            tagOptions = [
                <IndexDropdownNewRow
                    key="+"
                    value={this.state.searchVal}
                    focused={
                        this.state.focused === this.state.displayFilters.length
                    }
                    isForAnnotation={this.props.isForAnnotation}
                    allowAdd={this.props.allowAdd}
                    scrollIntoView={this.scrollElementIntoViewIfNeeded}
                    isForSidebar={this.props.isForSidebar}
                    source={this.props.source}
                />,
                ...tagOptions,
            ]
        }

        return tagOptions
    }

    render() {
        return (
            <IndexDropdown
                onTagSearchChange={this.handleSearchChange}
                onTagSearchSpecialKeyHandlers={[
                    {
                        test: (e) => e.key === 'Enter',
                        handle: this.handleSearchEnterPress,
                    },
                    {
                        test: (e) =>
                            e.key === 'ArrowUp' || e.key === 'ArrowDown',
                        handle: this.handleSearchArrowPress,
                    },
                ]}
                setInputRef={this.setInputRef}
                tagSearchValue={this.state.searchVal}
                clearSearchField={this.clearSearchField}
                showClearfieldBtn={this.showClearfieldBtn()}
                {...this.state}
                {...this.props}
            >
                {this.renderTags()}
            </IndexDropdown>
        )
    }
}

export default IndexDropdownContainer

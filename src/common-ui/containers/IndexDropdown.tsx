import React, { Component } from 'react'
import debounce from 'lodash/fp/debounce'
import noop from 'lodash/fp/noop'

import { remoteFunction } from '../../util/webextensionRPC'
import {
    IndexDropdown,
    IndexDropdownNewRow,
    IndexDropdownRow,
} from '../components'
import { ClickHandler } from '../../popup/types'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'

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
    sidebarTagDiv?: boolean
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
    }

    private err: { timestamp: number; err: Error }
    private suggestRPC
    private addTagRPC
    private delTagRPC
    private addTagsToOpenTabsRPC
    private delTagsFromOpenTabsRPC
    private processEvent
    private createNotif
    private inputEl: HTMLInputElement
    private fetchUserSuggestionsRPC
    private fetchHashtagSuggestionsRPC

    constructor(props: Props) {
        super(props)

        this.suggestRPC = remoteFunction('suggest')
        this.addTagRPC = this.props.fromOverview
            ? remoteFunction('addTag')
            : remoteFunction('addPageTag')
        this.delTagRPC = this.props.fromOverview
            ? remoteFunction('delTag')
            : remoteFunction('delPageTag')
        this.addTagsToOpenTabsRPC = remoteFunction('addTagsToOpenTabs')
        this.delTagsFromOpenTabsRPC = remoteFunction('delTagsFromOpenTabs')
        this.processEvent = remoteFunction('processEvent')
        this.createNotif = remoteFunction('createNotification')
        this.fetchUserSuggestionsRPC = remoteFunction('fetchUserSuggestions')
        this.fetchHashtagSuggestionsRPC = remoteFunction(
            'fetchHashtagSuggestions',
        )

        if (this.props.isForAnnotation) {
            this.addTagRPC = remoteFunction('addAnnotationTag')
            this.delTagRPC = remoteFunction('delAnnotationTag')
        }

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
                err =>
                    this.createNotif({
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

    /**
     * Domain inputs need to allow '.' while tags shouldn't.
     */

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

        // Only for add and remove from the popup or overview, we have already covered filter in overview
        if (this.allowIndexUpdate) {
            if (hover) {
                this.processEvent({
                    type: isAdded ? 'add' + sourceType : 'delete' + sourceType,
                })
            } else {
                this.processEvent({
                    type: isAdded
                        ? 'addPopup' + sourceType
                        : 'deletePopup' + sourceType,
                })
            }
        }
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
            ? filters.find(user => user.id === value.id) !== undefined
            : filters.includes(value)
    }
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

    private canCreateTag() {
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
        this.setState(() => ({ showError: true, errMsg: err.message }))
        this.err = {
            timestamp: Date.now(),
            err,
        }
    }

    /**
     * Used for 'Enter' presses or 'Add new tag' clicks.
     */
    private addTag = async () => {
        const newTag = this.getSearchVal()
        this.props.onFilterAdd(newTag)

        if (this.allowIndexUpdate) {
            try {
                if (this.props.allTabs) {
                    this.setState(state => ({
                        multiEdit: state.multiEdit.add(newTag),
                    }))
                    await this.addTagsToOpenTabsRPC({ name: newTag })
                } else {
                    await this.addTagRPC({
                        url: this.props.url,
                        tag: newTag,
                        tabId: this.props.tabId,
                    })
                }
            } catch (err) {
                this.handleError(err)
                this.props.onFilterDel(newTag)
            }
        }
        await this.storeTrackEvent(true)

        this.inputEl.focus()

        // Clear the component state.
        this.setState({
            searchVal: '',
            focused: -1,
            clearFieldBtn: false,
        })

        if (this.props.source === 'tag') {
            const tagSuggestions = await getLocalStorage(
                TAG_SUGGESTIONS_KEY,
                [],
            )

            if (!tagSuggestions.includes(newTag)) {
                tagSuggestions.push(newTag)
                await setLocalStorage(TAG_SUGGESTIONS_KEY, [...tagSuggestions])
            }
        }
    }

    private async handleSingleTagEdit(tag: any) {
        const pageHasTag = this.pageHasTag(tag, true)
        let updateState
        let revertState
        let updateDb

        if (pageHasTag) {
            updateState = this.props.onFilterDel
            revertState = this.props.onFilterAdd
            updateDb = this.delTagRPC
        } else {
            updateState = this.props.onFilterAdd
            revertState = this.props.onFilterDel
            updateDb = this.addTagRPC
        }

        try {
            if (this.allowIndexUpdate) {
                await updateDb({
                    url: this.props.url,
                    tag,
                    tabId: this.props.tabId,
                    fromOverview: this.props.fromOverview,
                })
            }
            updateState(tag)
            await this.storeTrackEvent(!pageHasTag)
        } catch (err) {
            this.handleError(err)
            revertState(tag)
        }
    }

    private async handleMultiTagEdit(tag: string) {
        const multiEdit = this.state.multiEdit
        let opPromise: Promise<any>

        if (!multiEdit.has(tag)) {
            multiEdit.add(tag)
            opPromise = this.addTagsToOpenTabsRPC({ name: tag })
        } else {
            multiEdit.delete(tag)
            opPromise = this.delTagsFromOpenTabsRPC({ name: tag })
        }

        // Allow state update to happen optimistically before async stuff is done
        this.setState(() => ({ multiEdit }))
        await opPromise
    }

    /**
     * Used for clicks on displayed tags. Will either add or remove tags to the page
     * depending on their current status as assoc. tags or not.
     */
    private handleTagSelection = (index: number) => async event => {
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

        if (this.props.allTabs) {
            await this.handleMultiTagEdit(tag)
        } else {
            await this.handleSingleTagEdit(tag)
        }

        this.inputEl.focus()

        // Clear the component state.
        this.setState({
            searchVal: '', // Clear the search field.
            focused: -1,
            clearFieldBtn: false,
        })

        if (this.props.source === 'tag') {
            const tagSuggestions = await getLocalStorage(
                TAG_SUGGESTIONS_KEY,
                [],
            )

            if (!tagSuggestions.includes(tag)) {
                tagSuggestions.push(tag)
                await setLocalStorage(TAG_SUGGESTIONS_KEY, [...tagSuggestions])
            }
        }
    }

    private handleExcTagSelection = (index: number) => event => {
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
                    ? excFilters.filter(user => user.id !== tag.id)
                    : excFilters.filter(a => a !== tag)
        }

        this.setState({
            excFilters,
            searchVal: '',
            focused: -1,
            clearFieldBtn: false,
        })
    }

    private handleSearchEnterPress(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        event.preventDefault()

        if (
            this.canCreateTag() &&
            this.state.focused === this.state.displayFilters.length
        ) {
            return this.addTag()
        }

        if (this.state.displayFilters.length && this.state.focused !== -1) {
            return this.handleTagSelection(this.state.focused)(event)
        }

        return null
    }

    private handleSearchArrowPress(
        event: React.KeyboardEvent<HTMLInputElement>,
    ) {
        event.preventDefault()

        // One extra index if the "add new tag" thing is showing
        let offset = this.canCreateTag() ? 0 : 1

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

    handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            this.props.env === 'inpage' &&
            (this.props.isForRibbon || this.props.isForAnnotation) &&
            !(event.ctrlKey || event.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(event.keyCode))
        ) {
            event.preventDefault()
            event.stopPropagation()
            this.setState(
                state => ({ searchVal: state.searchVal + event.key }),
                this.fetchTagSuggestions,
            )
            return
        }

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
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const searchVal = event.target.value

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
            state => ({ ...state, searchVal, displayFilters, clearFieldBtn }),
            this.fetchTagSuggestions, // Debounced suggestion fetch
        )
    }

    clearSearchField = () => {
        this.setState(state => ({
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
                suggestions = await this.suggestRPC(
                    searchVal,
                    this.props.source,
                )
            }
        } catch (err) {
            console.error(err)
        } finally {
            this.setState(state => ({
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
                    onClick={this.handleTagSelection(i)}
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
                    onClick={this.addTag}
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
                onTagSearchKeyDown={this.handleSearchKeyDown}
                setInputRef={this.setInputRef}
                numberOfTags={
                    this.props.allTabs
                        ? this.state.multiEdit.size
                        : this.state.filters.length
                }
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

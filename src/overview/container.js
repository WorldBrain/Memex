import React, { Component } from 'react'
import { Link } from 'react-router'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'

import { Wrapper, LoadingIndicator } from 'src/common-ui/components'
import { IndexDropdown, MigrationNotice } from 'src/common-ui/containers'
import * as actions from './actions'
import * as selectors from './selectors'
import * as constants from './constants'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'
import TagPill from './components/TagPill'
import Onboarding, { selectors as onboarding } from './onboarding'
import Filters, { selectors as filters, actions as filterActs } from './filters'
import Sidebar, {
    selectors as sidebarSels,
    actions as sidebarActs,
} from './sidebar'
import NoResultBadTerm from './components/NoResultBadTerm'
import localStyles from './components/Overview.css'
import { actions as listActs, selectors as customLists } from 'src/custom-lists'
import { ListEditDropdown } from 'src/custom-lists/components'

class OverviewContainer extends Component {
    static propTypes = {
        handleInputChange: PropTypes.func.isRequired,
        handleInputClick: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isMigrationRequired: PropTypes.bool.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isNewSearchLoading: PropTypes.bool.isRequired,
        noResults: PropTypes.bool.isRequired,
        isBadTerm: PropTypes.bool.isRequired,
        isInvalidSearch: PropTypes.bool.isRequired,
        showInitSearchMsg: PropTypes.bool.isRequired,
        resetActiveTagIndex: PropTypes.func.isRequired,
        searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
        totalResultCount: PropTypes.number,
        shouldShowCount: PropTypes.bool.isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
        handleTrashBtnClick: PropTypes.func.isRequired,
        handleToggleBm: PropTypes.func.isRequired,
        handleTagBtnClick: PropTypes.func.isRequired,
        handleCommentBtnClick: PropTypes.func.isRequired,
        handlePillClick: PropTypes.func.isRequired,
        addTag: PropTypes.func.isRequired,
        delTag: PropTypes.func.isRequired,
        resetFilterPopup: PropTypes.func.isRequired,
        showOnboarding: PropTypes.bool.isRequired,
        mouseOnSidebar: PropTypes.bool.isRequired,
        init: PropTypes.func.isRequired,
        handleToggleUrlToEdit: PropTypes.func.isRequired,
        showListDropdown: PropTypes.bool.isRequired,
        listStorageHandler: PropTypes.func.isRequired,
        isListFilterActive: PropTypes.bool.isRequired,
        handleCrossRibbonClick: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this._listStorageHandler = this.props.listStorageHandler()
    }

    componentDidMount() {
        document.addEventListener('click', this.handleOutsideClick, false)
        this.inputQueryEl.focus()
        this.props.init()
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick, false)
    }

    dropdownRefs = []
    tagBtnRefs = []

    setInputRef = el => (this.inputQueryEl = el)
    setTagDivRef = el => (this.tagDiv = el)
    setTagButtonRef = el => this.tagBtnRefs.push(el)
    trackDropwdownRef = el => this.dropdownRefs.push(el)

    handleSearchEnter = event => {
        if (event.key === 'Enter') {
            this.props.handleInputClick(event)
        }
    }

    renderTagsManager = ({ shouldDisplayTagPopup, url, tags }, index) =>
        shouldDisplayTagPopup ? (
            <IndexDropdown
                url={url}
                onFilterAdd={this.props.addTag(index)}
                onFilterDel={this.props.delTag(index)}
                setTagDivRef={this.setTagDivRef}
                initFilters={tags}
                source="tag"
                hover
            />
        ) : null

    renderTagPills({ tagPillsData, tags }, resultIndex) {
        const pills = tagPillsData.map((tag, i) => (
            <TagPill
                key={i}
                value={tag}
                onClick={this.props.handlePillClick(tag)}
            />
        ))

        // Add on dummy pill with '+' sign if over limit
        if (tags.length > constants.SHOWN_TAGS_LIMIT) {
            return [
                ...pills,
                <TagPill
                    key="+"
                    setRef={this.trackDropwdownRef}
                    value={`+${tags.length - constants.SHOWN_TAGS_LIMIT}`}
                    onClick={this.props.handleTagBtnClick(resultIndex)}
                    noBg
                />,
            ]
        }

        return pills
    }
    renderResultItems() {
        if (this.props.isNewSearchLoading) {
            return <LoadingIndicator />
        }

        const resultItems = this.props.searchResults.map((doc, i) => (
            <PageResultItem
                key={i}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc, i)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc, i)}
                tagManager={this.renderTagsManager(doc, i)}
                setTagButtonRef={this.setTagButtonRef}
                onTagBtnClick={this.props.handleTagBtnClick(i)}
                onCommentBtnClick={this.props.handleCommentBtnClick(doc)}
                tagPills={this.renderTagPills(doc, i)}
                isListFilterActive={this.props.isListFilterActive}
                showListDropdown={this.props.showListDropdown}
                handleToggleUrlToEdit={this.props.handleToggleUrlToEdit(doc)}
                handleCrossRibbonClick={this.props.handleCrossRibbonClick(doc)}
                {...doc}
            />
        ))

        // Insert waypoint at the end of results to trigger loading new items when
        // scrolling down
        if (this.props.needsWaypoint) {
            resultItems.push(
                <Waypoint
                    onEnter={this.props.onBottomReached}
                    key="waypoint"
                />,
            )
        }

        // Add loading spinner to the list end, if loading
        if (this.props.isLoading) {
            resultItems.push(<LoadingIndicator key="loading" />)
        }

        return resultItems
    }

    renderInitMessage = () => (
        <ResultsMessage>
            <div className={localStyles.title}>
                You didn't visit or{' '}
                <Link style={{ color: '#777' }} to="/import">
                    import
                </Link>
                <br /> <p className={localStyles.subTitle}>any websites yet.</p>
            </div>
            <div>
                <Link
                    className={localStyles.choiceBtn}
                    type="button"
                    to="/import"
                >
                    Import History & Bookmarks
                </Link>
            </div>
        </ResultsMessage>
    )

    renderResults() {
        if (this.props.isMigrationRequired) {
            return (
                <ResultsMessage>
                    <MigrationNotice />
                </ResultsMessage>
            )
        }

        if (this.props.isBadTerm) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm>
                        Search terms are too common, or have been filtered out
                        to increase performance.
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        if (this.props.isInvalidSearch) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm title="Invalid search query">
                        You can't exclude terms without including at least 1
                        term to search
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        if (this.props.showInitSearchMsg) {
            return this.renderInitMessage()
        }

        if (this.props.noResults) {
            return (
                <ResultsMessage>
                    <NoResultBadTerm>
                        found for this query. ¯\_(ツ)_/¯
                    </NoResultBadTerm>
                </ResultsMessage>
            )
        }

        // No issues; render out results list view
        return (
            <Wrapper>
                {this.props.shouldShowCount && (
                    <ResultsMessage small>
                        Found <strong>{this.props.totalResultCount}</strong>{' '}
                        results in your digital memory
                    </ResultsMessage>
                )}
                <ResultList
                    scrollDisabled={
                        this.props.showOnboarding || this.props.mouseOnSidebar
                    }
                >
                    {this.renderResultItems()}
                </ResultList>
            </Wrapper>
        )
    }

    handleOutsideClick = event => {
        // Reduces to `true` if any on input elements were clicked
        const wereAnyClicked = reduce((res, el) => {
            const isEqual = el != null ? el.isEqualNode(event.target) : false
            return res || isEqual
        }, false)

        const clickedTagDiv =
            this.tagDiv != null && this.tagDiv.contains(event.target)

        if (
            !clickedTagDiv &&
            !wereAnyClicked(this.tagBtnRefs) &&
            !wereAnyClicked(this.dropdownRefs)
        ) {
            this.props.resetActiveTagIndex()
            this.props.resetFilterPopup()
        }
    }

    renderFilters = () => <Filters setDropdownRef={this.trackDropwdownRef} />

    renderListDropdown = () => <ListEditDropdown />

    render() {
        return (
            <Wrapper>
                <Overview
                    {...this.props}
                    setInputRef={this.setInputRef}
                    onInputChange={this.props.handleInputChange}
                    filters={this.renderFilters()}
                    listEditDropdown={this.renderListDropdown()}
                    onQuerySearchKeyDown={this.handleSearchEnter}
                    isSearchDisabled={this.props.showOnboarding}
                    scrollDisabled={this.props.mouseOnSidebar}
                >
                    {this.renderResults()}
                </Overview>
                <Sidebar />
                <Onboarding />
            </Wrapper>
        )
    }
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    isNewSearchLoading: selectors.isNewSearchLoading(state),
    currentQueryParams: selectors.currentQueryParams(state),
    isMigrationRequired: selectors.isMigrationRequired(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    isInvalidSearch: selectors.isInvalidSearch(state),
    searchResults: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
    showFilters: filters.showFilters(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
    totalResultCount: selectors.totalResultCount(state),
    shouldShowCount: selectors.shouldShowCount(state),
    showOnboarding: onboarding.isVisible(state),
    showTooltip: selectors.showTooltip(state),
    tooltip: selectors.tooltip(state),
    isFirstTooltip: selectors.isFirstTooltip(state),
    isTooltipRenderable: selectors.isTooltipRenderable(state),
    mouseOnSidebar: sidebarSels.mouseOnSidebar(state),
    isListFilterActive: filters.listFilterActive(state),
    showListDropdown: customLists.listEditDropdown(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            onStartDateChange: actions.setStartDate,
            onEndDateChange: actions.setEndDate,
            onBottomReached: actions.getMoreResults,
            resetDeleteConfirm: actions.resetDeleteConfirm,
            deleteDocs: actions.deleteDocs,
            resetActiveTagIndex: actions.resetActiveTagIndex,
            onShowFilterChange: filterActs.showFilter,
            resetFilterPopup: filterActs.resetFilterPopup,
            fetchNextTooltip: actions.fetchNextTooltip,
            init: actions.init,
            onListDropdownChange: listActs.toggleListDropdown,
        },
        dispatch,
    ),
    handleInputChange: event => {
        const input = event.target
        dispatch(actions.setQueryTagsDomains(input.value, false))
    },
    handleInputClick: event => {
        const input = event.target
        dispatch(actions.setQueryTagsDomains(input.value, true))
    },
    handleTrashBtnClick: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(actions.showDeleteConfirm(url, index))
    },
    handleToggleBm: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(actions.toggleBookmark(url, index))
    },
    handleTagBtnClick: index => event => {
        event.preventDefault()
        dispatch(actions.showTags(index))
    },
    handlePillClick: tag => event => {
        event.preventDefault()
        dispatch(filterActs.toggleTagFilter(tag))
    },
    handleCommentBtnClick: ({ url, title }) => event => {
        event.preventDefault()
        dispatch(sidebarActs.openSidebar(url, title))
    },
    addTag: resultIndex => tag => dispatch(actions.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(actions.delTag(tag, resultIndex)),
    toggleShowTooltip: event => dispatch(actions.toggleShowTooltip()),
    listStorageHandler: () => dispatch(listActs.listStorage()),
    handleToggleUrlToEdit: ({ url }) => () =>
        dispatch(listActs.toggleUrlToEdit(url)),
    handleCrossRibbonClick: ({ url }) => event => {
        dispatch(listActs.removePageFromList(url))
        dispatch(actions.hideResultItem(url))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(OverviewContainer)

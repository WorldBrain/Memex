import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'

import analytics from 'src/analytics'
import { Wrapper, LoadingIndicator } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import * as actions from './actions'
import * as selectors from './selectors'
import * as constants from './constants'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'
import TagPill from './components/TagPill'
import FilterPill from './components/FilterPill'
import ExpandButton from './components/ExpandButton'
import Onboarding, { selectors as onboarding } from './onboarding'

class OverviewContainer extends Component {
    static propTypes = {
        grabFocusOnMount: PropTypes.bool.isRequired,
        handleInputChange: PropTypes.func.isRequired,
        handleInputClick: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isNewSearchLoading: PropTypes.bool.isRequired,
        noResults: PropTypes.bool.isRequired,
        isBadTerm: PropTypes.bool.isRequired,
        showInitSearchMsg: PropTypes.bool.isRequired,
        resetActiveTagIndex: PropTypes.func.isRequired,
        searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
        totalResultCount: PropTypes.number.isRequired,
        shouldShowCount: PropTypes.bool.isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
        handleTrashBtnClick: PropTypes.func.isRequired,
        handleToggleBm: PropTypes.func.isRequired,
        handleTagBtnClick: PropTypes.func.isRequired,
        handlePillClick: PropTypes.func.isRequired,
        addTag: PropTypes.func.isRequired,
        delTag: PropTypes.func.isRequired,
        resetFilterPopup: PropTypes.func.isRequired,
        addTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        delDomainFilter: PropTypes.func.isRequired,
        filterTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filterDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
        handleFilterPillClick: PropTypes.func.isRequired,
        setFilterPopup: PropTypes.func.isRequired,
        shouldDisplayDomainFilterPopup: PropTypes.bool.isRequired,
        shouldDisplayTagFilterPopup: PropTypes.bool.isRequired,
        showOnboarding: PropTypes.bool.isRequired,
    }

    componentDidMount() {
        analytics.trackPage({ title: document.title })

        document.addEventListener('click', this.handleOutsideClick, false)
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick, false)
    }

    furtherTagRefs = []
    tagBtnRefs = []

    setInputRef = el => (this.inputQueryEl = el)
    setTagDivRef = el => (this.tagDiv = el)
    setTagButtonRef = el => this.tagBtnRefs.push(el)
    addFurtherTagRef = el => this.furtherTagRefs.push(el)

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

    renderTagsFilter = () =>
        this.props.shouldDisplayTagFilterPopup ? (
            <IndexDropdown
                setTagDivRef={this.setTagDivRef}
                onFilterAdd={this.props.addTagFilter}
                onFilterDel={this.props.delTagFilter}
                initFilters={this.props.filterTags}
                source="tag"
            />
        ) : null

    renderDomainsFilter = () =>
        this.props.shouldDisplayDomainFilterPopup ? (
            <IndexDropdown
                setTagDivRef={this.setTagDivRef}
                onFilterAdd={this.props.addDomainFilter}
                onFilterDel={this.props.delDomainFilter}
                initFilters={this.props.filterDomains}
                source="domain"
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
                    setRef={this.addFurtherTagRef}
                    value={`+${tags.length - constants.SHOWN_TAGS_LIMIT}`}
                    onClick={this.props.handleTagBtnClick(resultIndex)}
                    noBg
                />,
            ]
        }

        return pills
    }

    renderFilterPills(data, option) {
        const Filterpills = data
            .slice(0, constants.SHOWN_FILTER_LIMIT)
            .map((tag, i) => (
                <FilterPill
                    key={i}
                    value={tag}
                    onClick={this.props.handleFilterPillClick(tag, option)}
                />
            ))

        // Add on dummy pill with '+' sign if over limit
        if (data.length > constants.SHOWN_FILTER_LIMIT) {
            return [
                ...Filterpills,
                <ExpandButton
                    key="+"
                    setRef={this.addFurtherTagRef}
                    value={`+${data.length - constants.SHOWN_FILTER_LIMIT}`}
                    onClick={this.props.setFilterPopup(option)}
                    noBg
                />,
            ]
        }

        return Filterpills
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
                tagPills={this.renderTagPills(doc, i)}
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
            You have not made any history yet.
            <br />First, you need to visit some websites or{' '}
            <a
                style={{ color: '#928989' }}
                href="/options/options.html#/import"
            >
                import your existing history & bookmarks
            </a>.<br />
            <br />
            <strong>Tip: </strong>Read the{' '}
            <a
                style={{ color: '#928989' }}
                href="/options/options.html#/tutorial"
            >
                quick tutorial
            </a>.
            <br />
            <br />
            <img src="/img/ship.png" />
        </ResultsMessage>
    )

    renderResults() {
        if (this.props.isBadTerm) {
            return (
                <ResultsMessage>
                    Your search terms are very vague, please try and use more
                    unique language
                </ResultsMessage>
            )
        }

        if (this.props.showInitSearchMsg) {
            return this.renderInitMessage()
        }

        if (this.props.noResults) {
            return (
                <ResultsMessage>
                    No results found for this query. ¯\_(ツ)_/¯{' '}
                </ResultsMessage>
            )
        }

        // No issues; render out results list view
        return (
            <Wrapper>
                {this.props.shouldShowCount && (
                    <ResultsMessage small>
                        Found <strong>
                            {this.props.totalResultCount}
                        </strong>{' '}
                        results in your digital memory
                    </ResultsMessage>
                )}
                <ResultList scrollDisabled={this.props.showOnboarding}>
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
            !wereAnyClicked(this.furtherTagRefs)
        ) {
            this.props.resetActiveTagIndex()
            this.props.resetFilterPopup()
        }
    }

    render() {
        const { filterTags, filterDomains } = this.props

        return (
            <Wrapper>
                <Overview
                    {...this.props}
                    setInputRef={this.setInputRef}
                    onInputChange={this.props.handleInputChange}
                    tagFilterManager={this.renderTagsFilter()}
                    domainFilterManager={this.renderDomainsFilter()}
                    setTagDomainButtonRef={this.addFurtherTagRef}
                    tagFilterPills={this.renderFilterPills(filterTags, 'tag')}
                    domainFilterPills={this.renderFilterPills(
                        filterDomains,
                        'domain',
                    )}
                    onQuerySearchKeyDown={this.handleSearchEnter}
                    isSearchDisabled={this.props.showOnboarding}
                >
                    {this.renderResults()}
                </Overview>
                <Onboarding />
            </Wrapper>
        )
    }
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    isNewSearchLoading: selectors.isNewSearchLoading(state),
    currentQueryParams: selectors.currentQueryParams(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    searchResults: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
    showFilter: selectors.showFilter(state),
    showOnlyBookmarks: selectors.showOnlyBookmarks(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
    totalResultCount: selectors.totalResultCount(state),
    shouldShowCount: selectors.shouldShowCount(state),
    isClearFilterButtonShown: selectors.isClearFilterButtonShown(state),
    filterPopup: selectors.filterPopup(state),
    filterTags: selectors.filterTags(state),
    filterDomains: selectors.filterDomains(state),
    shouldDisplayDomainFilterPopup: selectors.shouldDisplayDomainFilterPopup(
        state,
    ),
    shouldDisplayTagFilterPopup: selectors.shouldDisplayTagFilterPopup(state),
    showOnboarding: onboarding.isVisible(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            onStartDateChange: actions.setStartDate,
            onEndDateChange: actions.setEndDate,
            onBottomReached: actions.getMoreResults,
            resetDeleteConfirm: actions.resetDeleteConfirm,
            deleteDocs: actions.deleteDocs,
            onShowFilterChange: actions.showFilter,
            onShowOnlyBookmarksChange: actions.toggleBookmarkFilter,
            resetActiveTagIndex: actions.resetActiveTagIndex,
            clearAllFilters: actions.resetFilters,
            onFilterClick: actions.setFilterPopup,
            resetFilterPopup: actions.resetFilterPopup,
            addTagFilter: actions.addTagFilter,
            delTagFilter: actions.delTagFilter,
            addDomainFilter: actions.addDomainFilter,
            delDomainFilter: actions.delDomainFilter,
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
        dispatch(actions.filterTag(tag))
    },
    addTag: resultIndex => tag => dispatch(actions.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(actions.delTag(tag, resultIndex)),
    handleFilterPillClick: (tag, option) => event => {
        event.preventDefault()
        if (option === 'tag') {
            dispatch(actions.delTagFilter(tag))
        } else {
            dispatch(actions.delDomainFilter(tag))
        }
    },
    setFilterPopup: option => event => {
        event.preventDefault()
        dispatch(actions.setFilterPopup(option))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)

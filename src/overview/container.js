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
import Onboarding, { selectors as onboarding } from './onboarding'
import Filters, { selectors as filters, actions as filterActs } from './filters'
import NoResultBadTerm from './components/NoResultBadTerm'
import localStyles from './components/Overview.css'

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
        showOnboarding: PropTypes.bool.isRequired,
        // fetchNextTooltip: PropTypes.func.isRequired,
        // isFirstTooltip: PropTypes.bool.isRequired,
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
            <div className={localStyles.title}>
                You didn't visit or{' '}
                <a
                    style={{ color: '#777' }}
                    href="/options/options.html#/import"
                >
                    import
                </a>
                <br /> <p className={localStyles.subTitle}>any websites yet.</p>
            </div>
            <div>
                <a
                    className={localStyles.choiceBtn}
                    type="button"
                    href="/options/options.html#/import"
                >
                    Import History & Bookmarks
                </a>
            </div>
        </ResultsMessage>
    )

    renderResults() {
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
            !wereAnyClicked(this.dropdownRefs)
        ) {
            this.props.resetActiveTagIndex()
            this.props.resetFilterPopup()
        }
    }

    renderFilters = () => <Filters setDropdownRef={this.trackDropwdownRef} />

    render() {
        return (
            <Wrapper>
                <Overview
                    {...this.props}
                    setInputRef={this.setInputRef}
                    onInputChange={this.props.handleInputChange}
                    filters={this.renderFilters()}
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
    showFilters: filters.showFilters(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
    totalResultCount: selectors.totalResultCount(state),
    shouldShowCount: selectors.shouldShowCount(state),
    showOnboarding: onboarding.isVisible(state),
    showTooltip: selectors.showTooltip(state),
    tooltip: selectors.tooltip(state),
    isFirstTooltip: selectors.isFirstTooltip(state),
    isTooltipRenderable: selectors.isTooltipRenderable(state),
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
    addTag: resultIndex => tag => dispatch(actions.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(actions.delTag(tag, resultIndex)),
    toggleShowTooltip: event => dispatch(actions.toggleShowTooltip()),
})

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)

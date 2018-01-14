import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import { Wrapper, LoadingIndicator } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'

class OverviewContainer extends Component {
    static propTypes = {
        grabFocusOnMount: PropTypes.bool.isRequired,
        handleInputChange: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isNewSearchLoading: PropTypes.bool.isRequired,
        noResults: PropTypes.bool.isRequired,
        isBadTerm: PropTypes.bool.isRequired,
        showInitSearchMsg: PropTypes.bool.isRequired,
        searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
        totalResultCount: PropTypes.number.isRequired,
        shouldShowCount: PropTypes.bool.isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
        handleTrashBtnClick: PropTypes.func.isRequired,
        handleToggleBm: PropTypes.func.isRequired,
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    setInputRef = element => {
        this.inputQueryEl = element
    }

    renderResultItems() {
        const resultItems = this.props.searchResults.map((doc, i) => (
            <PageResultItem
                key={i}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc.url, i)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc.url, i)}
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

        if (this.props.isNewSearchLoading) {
            return (
                <ResultList>
                    <LoadingIndicator />
                </ResultList>
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
                <ResultList>{this.renderResultItems()}</ResultList>
            </Wrapper>
        )
    }

    render() {
        return (
            <Overview
                {...this.props}
                setInputRef={this.setInputRef}
                onInputChange={this.props.handleInputChange}
            >
                {this.renderResults()}
            </Overview>
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
        },
        dispatch,
    ),
    handleInputChange: event => {
        const input = event.target
        dispatch(actions.setQuery(input.value))
    },
    handleTrashBtnClick: (url, index) => event => {
        event.preventDefault()
        dispatch(actions.showDeleteConfirm(url, index))
    },
    handleToggleBm: (url, index) => event => {
        event.preventDefault()
        dispatch(actions.toggleBookmark(url, index))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)

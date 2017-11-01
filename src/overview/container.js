import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import { LoadingIndicator } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import * as constants from './constants'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'

class OverviewContainer extends Component {
    static propTypes = {
        grabFocusOnMount: PropTypes.bool.isRequired,
        onInputChange: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isNewSearchLoading: PropTypes.bool.isRequired,
        noResults: PropTypes.bool.isRequired,
        isBadTerm: PropTypes.bool.isRequired,
        searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    setInputRef = element => {
        this.inputQueryEl = element
    }

    handleInputChange = event => {
        const input = event.target

        this.props.onInputChange(input.value)
    }

    renderResultItems() {
        const {
            searchResults,
            onBottomReached,
            isLoading,
            needsWaypoint,
        } = this.props

        const resultItems = searchResults.map(doc => (
            <li key={doc._id}>
                <PageResultItem
                    doc={doc}
                    sizeInMB={doc.freezeDrySize}
                    isBookmark={
                        doc.displayType === constants.RESULT_TYPES.BOOKMARK
                    }
                />
            </li>
        ))

        // Insert waypoint at the end of results to trigger loading new items when scrolling down
        if (needsWaypoint) {
            resultItems.push(
                <Waypoint onEnter={onBottomReached} key="waypoint" />,
            )
        }

        // Add loading spinner to the list end, if loading (may change this)
        if (isLoading) {
            resultItems.push(<LoadingIndicator key="loading" />)
        }

        return resultItems
    }

    renderResults() {
        if (this.props.isBadTerm) {
            return (
                <ResultsMessage>
                    Your search terms are very vague, please try and use more
                    unique language
                </ResultsMessage>
            )
        }

        if (this.props.noResults) {
            return <ResultsMessage>No results</ResultsMessage>
        }

        if (this.props.isNewSearchLoading) {
            return (
                <ResultList>
                    {[<LoadingIndicator key="loadingIndicator" />]}
                </ResultList>
            )
        }

        // No issues; render out results list view
        return <ResultList>{this.renderResultItems()}</ResultList>
    }

    render() {
        return (
            <Overview
                {...this.props}
                setInputRef={this.setInputRef}
                onInputChange={this.handleInputChange}
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
})

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            onInputChange: actions.setQuery,
            onStartDateChange: actions.setStartDate,
            onEndDateChange: actions.setEndDate,
            onBottomReached: actions.getMoreResults,
            hideDeleteConfirm: actions.hideDeleteConfirm,
            deleteDocs: actions.deleteDocs,
            onShowFilterChange: actions.showFilter,
            onShowOnlyBookmarksChange: actions.toggleBookmarkFilter,
        },
        dispatch,
    )

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)

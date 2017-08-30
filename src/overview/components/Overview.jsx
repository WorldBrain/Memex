import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import * as actions from '../actions'
import * as selectors from '../selectors'
import * as constants from '../constants'
import ResultList from './ResultList'
import DateRangeSelection from './DateRangeSelection'
import DeleteConfirmation from './DeleteConfirmation'
import PageResultItem from './PageResultItem'
import { LoadingIndicator } from 'src/common-ui/components'
import styles from './Overview.css'


class Overview extends React.Component {
    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    renderResultItems() {
        const { searchResults, onBottomReached, isLoading, needsWaypoint } = this.props

        const resultItems = searchResults.map(doc => (
            <li key={doc._id}>
                <PageResultItem
                    doc={doc}
                    sizeInMB={doc.freezeDrySize}
                    isBookmark={doc.displayType === constants.RESULT_TYPES.BOOKMARK}
                />
            </li>
        ))

        // Insert waypoint at the end of results to trigger loading new items when scrolling down
        if (needsWaypoint) {
            resultItems.push(<Waypoint onEnter={onBottomReached} key='waypoint' />)
        }

        // Add loading spinner to the list end, if loading (may change this)
        if (isLoading) {
            resultItems.push(<LoadingIndicator key='loading' />)
        }

        return resultItems
    }

    renderNoResultsMsg() {
        return <p className={styles.noResultMessage}>No results</p>
    }

    render() {
        const { query, startDate, endDate } = this.props.currentQueryParams

        return (
            <div>
                <div className={styles.navbar}>
                    <div className={styles.logo} />
                    <div className={styles.searchField}>
                        <input
                            className={styles.query}
                            onInput={e => { this.props.onInputChanged(e.target.value) }}
                            onKeyDown={e => {
                                if (e.key === 'Escape') { this.props.onInputChanged('') }
                            }}
                            placeholder='Search your memory'
                            value={query}
                            ref={ref => { this.inputQueryEl = ref }}
                        />
                        <DateRangeSelection
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={this.props.onStartDateChange}
                            onEndDateChange={this.props.onEndDateChange}
                        />
                    </div>
                    <div className={styles.links}>
                        <a href='/options/options.html'>
                            <img
                                src='/img/settings-icon.png'
                                className={styles.icon}
                            />
                        </a>
                    </div>
                </div>

                <div className={styles.main}>
                    {this.props.noResults
                        ? this.renderNoResultsMsg()
                        : <ResultList>{this.renderResultItems()}</ResultList>}
                    <DeleteConfirmation
                        isShown={this.props.isDeleteConfShown}
                        close={this.props.hideDeleteConfirm}
                        deleteAll={this.props.deleteAssociatedDocs(this.props.deleteVisitId)}
                        deleteVisit={this.props.deleteVisit(this.props.deleteVisitId)}
                    />
                </div>
            </div>
        )
    }
}

Overview.propTypes = {
    grabFocusOnMount: PropTypes.bool,
    currentQueryParams: PropTypes.shape({
        query: PropTypes.string,
        startDate: PropTypes.number,
        endDate: PropTypes.number,
    }).isRequired,
    onInputChanged: PropTypes.func,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
    onBottomReached: PropTypes.func,
    isLoading: PropTypes.bool,
    noResults: PropTypes.bool.isRequired,
    searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    deleteVisitId: PropTypes.string,
    hideDeleteConfirm: PropTypes.func.isRequired,
    deleteAssociatedDocs: PropTypes.func.isRequired,
    deleteVisit: PropTypes.func.isRequired,
    needsWaypoint: PropTypes.bool.isRequired,
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    currentQueryParams: selectors.currentQueryParams(state),
    noResults: selectors.noResults(state),
    searchResults: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    deleteVisitId: selectors.deleteVisitId(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        onInputChanged: actions.setQuery,
        onStartDateChange: actions.setStartDate,
        onEndDateChange: actions.setEndDate,
        onBottomReached: actions.getMoreResults,
        hideDeleteConfirm: actions.hideDeleteConfirm,
    }, dispatch),
    deleteAssociatedDocs: visitId => () => dispatch(actions.deleteVisit(visitId, true)),
    deleteVisit: visitId => () => dispatch(actions.deleteVisit(visitId)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

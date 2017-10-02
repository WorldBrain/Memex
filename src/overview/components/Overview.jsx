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

    handleInputChange = e => this.props.onInputChanged(e.target.value)

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

    renderCustomMsg = msg => <p className={styles.noResultMessage}>{msg}</p>

    renderResults() {
        if (this.props.isBadTerm) {
            return this.renderCustomMsg(
                'Your search terms are very vague, please try and use more unique language')
        }

        if (this.props.noResults) {
            return this.renderCustomMsg('No results')
        }

        // No issues; render out results list view
        return <ResultList>{this.renderResultItems()}</ResultList>
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
                            onChange={this.handleInputChange}
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
                    {this.renderResults()}
                    <DeleteConfirmation
                        isShown={this.props.isDeleteConfShown}
                        close={this.props.hideDeleteConfirm}
                        deleteDocs={this.props.deleteDocs}
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
    isBadTerm: PropTypes.bool.isRequired,
    searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
    isDeleteConfShown: PropTypes.bool.isRequired,
    hideDeleteConfirm: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
    needsWaypoint: PropTypes.bool.isRequired,
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    currentQueryParams: selectors.currentQueryParams(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    searchResults: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        onInputChanged: actions.setQuery,
        onStartDateChange: actions.setStartDate,
        onEndDateChange: actions.setEndDate,
        onBottomReached: actions.getMoreResults,
        hideDeleteConfirm: actions.hideDeleteConfirm,
        deleteDocs: actions.deleteDocs,
    }, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

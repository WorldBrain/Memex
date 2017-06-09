import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import ResultList from './ResultList'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.refs['inputQuery'].focus()
        }
    }

    render() {
        return (
            <div>
                <div className={styles.navbar}>
                    <input
                        className={styles.query}
                        onChange={e => this.props.onInputChanged(e.target.value)}
                        placeholder='Search your memory'
                        value={this.props.query}
                        ref='inputQuery'
                     />
                </div>
                <DateRangeSelection
                    startDate={this.props.startDate}
                    endDate={this.props.endDate}
                    onStartDateChange={this.props.onStartDateChange}
                    onEndDateChange={this.props.onEndDateChange}
                />
                <div>

                <div className={styles.main}>
                    <ResultList
                        searchResult={this.props.searchResult}
                        searchQuery={this.props.query}
                        onBottomReached={this.props.onBottomReached}
                        waitingForResults={this.props.waitingForResults}
                        {...this.props.searchMetaData}
                    />
                </div>
            </div>
        )
    }
}

Overview.propTypes = {
    grabFocusOnMount: PropTypes.bool,
    query: PropTypes.string,
    onInputChanged: PropTypes.func,
    startDate: PropTypes.number,
    endDate: PropTypes.number,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
    onBottomReached: PropTypes.func,
    waitingForResults: PropTypes.bool,
    searchMetaData: PropTypes.shape({
        searchedUntil: PropTypes.string,
        resultsExhausted: PropTypes.bool,
    }).isRequired,
    searchResult: PropTypes.arrayOf(PropTypes.shape({
        latestResult: PropTypes.object.isRequired,
        rest: PropTypes.arrayOf(PropTypes.object).isRequired,
    })).isRequired,
}


const mapStateToProps = state => ({
    ...selectors.ourState(state),
    waitingForResults: !!selectors.ourState(state).waitingForResults, // cast to boolean
    searchResult: selectors.results(state),
    searchMetaData: selectors.searchMetaData(state),
})

const mapDispatchToProps = dispatch => ({
    onInputChanged: input => {
        dispatch(actions.setQuery({query: input}))
    },
    onStartDateChange: date => {
        dispatch(actions.setStartDate({startDate: date}))
    },
    onEndDateChange: date => {
        dispatch(actions.setEndDate({endDate: date}))
    },
    onBottomReached: () => {
        dispatch(actions.loadMoreResults())
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

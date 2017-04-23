import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import queryString from 'query-string'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    componentWillMount() {
        const queryVariables = queryString.parse(location.search)
        if (queryVariables && queryVariables.searchQuery) {
            this.props.onInputChanged(queryVariables.searchQuery)
        }
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.refs['inputQuery'].focus()
        }
    }

    render() {
        return (
            <div>
                <div>
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
                    <ResultList
                        searchResult={this.props.searchResult}
                        searchQuery={this.props.query}
                        onBottomReached={this.props.onBottomReached}
                        waitingForResults={this.props.waitingForResults}
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
    searchResult: PropTypes.object,
}


const mapStateToProps = state => ({
    ...ourState(state),
    waitingForResults: !!ourState(state).waitingForResults, // cast to boolean
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

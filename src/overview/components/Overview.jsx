import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import ResultList from './ResultList'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
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
                                src='img/settings-icon.png'
                                className={styles.icon}
                            />
                        </a>
                    </div>
                </div>

                <div className={styles.main}>
                    <ResultList
                        searchResult={this.props.searchResult}
                        searchQuery={query}
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
    currentQueryParams: PropTypes.shape({
        query: PropTypes.string,
        startDate: PropTypes.number,
        endDate: PropTypes.number,
    }).isRequired,
    onInputChanged: PropTypes.func,
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
    currentQueryParams: selectors.currentQueryParams(state),
    waitingForResults: !!selectors.ourState(state).waitingForResults, // cast to boolean
    searchResult: selectors.results(state),
    searchMetaData: selectors.searchMetaData(state),
})

const mapDispatchToProps = dispatch => bindActionCreators({
    onInputChanged: actions.setQuery,
    onStartDateChange: actions.setStartDate,
    onEndDateChange: actions.setEndDate,
    onBottomReached: actions.loadMoreResults,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'
import LoadingIndicator from './LoadingIndicator'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.refs['inputQuery'].focus()
        }

        // Add an onscroll event listener to listen for scrolling events
        window.addEventListener('scroll', (e) => {
            // Calculate what percentage of the screen has ben scrolled
            let scrollPercentage = (e.target.body.scrollTop / (e.target.body.scrollHeight - e.target.body.clientHeight)) * 100

            // Check if that percentage is above 80% that is towards the end
            // And if the system is not waiting for results so as to get more results.
            if ((scrollPercentage >= 80) && (this.props.waitingForResults === 0)) {
                // console.log("get more data", scrollPercentage, this.props.searchResult,this.props.searchResult.rows[this.props.searchResult.rows.length - 1].doc.visitStart);
                this.props.getMoreResults(this.props.searchResult.rows[this.props.searchResult.rows.length - 1].doc.visitStart, e.target.body.scrollTop)
            }

            // console.log(e.target.body.clientHeight, e.target.body.scrollHeight, e.target.body.scrollTop, scrollPercentage)
        })
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
                    {this.props.waitingForResults
                        ? <LoadingIndicator />
                        : (
                            <ResultList
                                searchResult={this.props.searchResult}
                                searchQuery={this.props.query}
                            />
                        )
                    }
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
    getMoreResults: PropTypes.func,
    waitingForResults: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    searchResult: PropTypes.object,
}


const mapStateToProps = state => ourState(state)

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
    getMoreResults: (date, position) => {
        dispatch(actions.getMoreResults({loadingIndicator: true, endDate: date, scrollPosition: position}))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

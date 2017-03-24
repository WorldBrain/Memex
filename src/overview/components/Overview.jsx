import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import DatePicker from 'react-datepicker'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'
import LoadingIndicator from './LoadingIndicator'
import styles from './Overview.css'


class Overview extends React.Component {
    render() {
        return (
            <div>
                <div>
                    <input
                        className={styles.query}
                        onChange={e=>this.props.onInputChanged(e.target.value)}
                        placeholder="Search your memory"
                        value={this.props.query}
                        ref='inputQuery'
                    >
                    </input>
                </div>
                <div>
                    <DatePicker
                        placeholderText="after.."
                        selected={moment(this.props.startDate)}
                        maxDate={moment()}
                        onChange={date=>this.props.onStartDateChange(date.valueOf())}
                    />
                    <DatePicker
                        placeholderText="before.."
                        selected={moment(this.props.endDate)}
                        maxDate={moment()}
                        onChange={date=>this.props.onEndDateChange(date.valueOf())}
                    />
                </div>
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

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.refs['inputQuery'].focus()
        }
    }
}

const mapStateToProps = (state) => ({
    query: ourState(state).query,
    searchResult: ourState(state).searchResult,
    waitingForResults: ourState(state).waitingForResults,
    startDate: ourState(state).startDate,
    endDate:  ourState(state).endDate
})

const mapDispatchToProps = (dispatch) => ({
    onInputChanged: input => {
        dispatch(actions.setQuery({query: input}))
    },
    onStartDateChange: date => {
        dispatch(actions.setStartDate({startDate: date}))
    },
    onEndDateChange: date => {
        dispatch(actions.setEndDate({endDate: date}))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)

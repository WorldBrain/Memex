import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import datePickerStyles from 'react-datepicker/dist/react-datepicker-cssmodules.css'

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
                <div className={styles.dateRangeSelection}>
                    <DatePicker
                        className={styles.datePicker}
                        placeholderText="after.."
                        isClearable={true}
                        selected={
                            this.props.startDate && moment(this.props.startDate)
                        }
                        selectsStart
                        startDate={moment(this.props.startDate || 0)}
                        endDate={moment(this.props.endDate)}
                        maxDate={moment()}
                        onChange={date => this.props.onStartDateChange(
                            date ? date.valueOf() : undefined,
                        )}
                    />
                    <DatePicker
                        className={styles.datePicker}
                        placeholderText="before.."
                        isClearable={true}
                        selected={
                            this.props.endDate && moment(this.props.endDate)
                        }
                        selectsEnd
                        startDate={moment(this.props.startDate || 0)}
                        endDate={moment(this.props.endDate)}
                        maxDate={moment()}
                        onChange={date => this.props.onEndDateChange(
                            date ? date.valueOf() : undefined,
                        )}
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

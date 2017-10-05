import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import chrono from 'chrono-node'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import styles from './DateRangeSelection.css'
import './datepicker-overrides.css'

class DateRangeSelection extends Component {
    state = {
        startDateText: null,
        endDateText: null,
    }

    componentDidMount() {
        // Override event handlers within the `react-datepicker` input elements, allowing us to
        //  update state based on keydown
        this.startDateDatePicker.input.addEventListener('keydown',
            this.handleKeydown({ isStartDate: true }))
        this.endDateDatePicker.input.addEventListener('keydown',
            this.handleKeydown({ isStartDate: false }))
    }

    handleKeydown = ({ isStartDate }) => event => {
        if (event.key === 'Enter') {
            event.stopImmediatePropagation()
            this.submitDateChange({ isStartDate })()
        }
    }

    submitDateChange = ({ isStartDate }) => () => {
        const currentDate = isStartDate ? this.props.startDate : this.props.endDate
        const updateDate = isStartDate ? this.props.onStartDateChange : this.props.onEndDateChange
        const dateState = isStartDate ? this.state.startDateText : this.state.endDateText

        let dateToChange
        const date = moment(dateState, 'DD-MM-YYYY', true)

        // If moment date is invalid, try the NLP parsing value
        if (!date.isValid()) {
            const nlpDate = chrono.parseDate(dateState)
            dateToChange = nlpDate != null ? nlpDate.getTime() : null
        } else {
            // If end date, we want to search back from end of day
            if (!isStartDate && date != null) {
                date.endOf('day')
            }

            dateToChange = date.valueOf()
        }

        // Trigger state update only if there is a change
        if (dateToChange != null && dateToChange !== currentDate) {
            updateDate(dateToChange)
        }
    }

    handleDateChange = ({ isStartDate }) => date => {
        const updateDate = isStartDate ? this.props.onStartDateChange : this.props.onEndDateChange
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'

        this.setState(state => ({
            ...state,
            [stateKey]: date ? date.format('DD-MM-YYYY') : null,
        }))

        // If end date, we want to search back from end of day
        if (!isStartDate && date != null) {
            date.endOf('day')
        }

        updateDate(date ? date.valueOf() : undefined)
    }

    render() {
        const { startDate, endDate } = this.props

        return (
            <div className={styles.dateRangeSelection}>
                <DatePicker
                    ref={dp => { this.startDateDatePicker = dp }}
                    className={styles.datePicker}
                    dateFormat='DD-MM-YYYY'
                    placeholderText='after..'
                    isClearable
                    selected={startDate && moment(startDate)}
                    selectsStart
                    disabledKeyboardNavigation
                    startDate={moment(startDate || 0)}
                    endDate={moment(endDate)}
                    maxDate={moment()}
                    onChange={this.handleDateChange({ isStartDate: true })}
                    onChangeRaw={e => this.setState({ startDateText: e.target.value })}
                    onBlur={this.submitDateChange({ isStartDate: true })}
                />
                <img
                    src='/img/to-icon.png'
                    className={styles.toIcon}
                />
                <DatePicker
                    ref={dp => { this.endDateDatePicker = dp }}
                    className={styles.datePicker}
                    dateFormat='DD-MM-YYYY'
                    placeholderText='before..'
                    isClearable
                    selected={endDate && moment(endDate)}
                    selectsEnd
                    startDate={moment(startDate || 0)}
                    endDate={moment(endDate)}
                    maxDate={moment()}
                    disabledKeyboardNavigation
                    onChange={this.handleDateChange({ isStartDate: false })}
                    onChangeRaw={e => this.setState({ endDateText: e.target.value })}
                    onBlur={this.submitDateChange({ isStartDate: false })}
                />
            </div>
        )
    }
}

DateRangeSelection.propTypes = {
    startDate: PropTypes.number,
    endDate: PropTypes.number,
    onStartDateChange: PropTypes.func,
    onEndDateChange: PropTypes.func,
}


export default DateRangeSelection

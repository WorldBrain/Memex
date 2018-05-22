import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import chrono from 'chrono-node'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import analytics from 'src/analytics'
import { DATE_PICKER_DATE_FORMAT as FORMAT } from '../constants'
import styles from './DateRangeSelection.css'
import './datepicker-overrides.css'

class DateRangeSelection extends Component {
    static propTypes = {
        startDate: PropTypes.number,
        endDate: PropTypes.number,
        onStartDateChange: PropTypes.func,
        onEndDateChange: PropTypes.func,
        disabled: PropTypes.bool,
    }

    state = {
        startDateText: this.props.startDate
            ? moment(this.props.startDate).format(FORMAT)
            : '',
        endDateText: this.props.endDate
            ? moment(this.props.endDate).format(FORMAT)
            : '',
    }

    componentDidMount() {
        // Override event handlers within the `react-datepicker` input elements, allowing us to
        //  update state based on keydown
        this.startDatePicker.input.addEventListener(
            'keydown',
            this.handleKeydown({ isStartDate: true }),
        )
        this.endDatePicker.input.addEventListener(
            'keydown',
            this.handleKeydown({ isStartDate: false }),
        )

        // Override clear button handlers
        this.startDatePicker.onClearClick = this.handleClearClick({
            isStartDate: true,
        })
        this.endDatePicker.onClearClick = this.handleClearClick({
            isStartDate: false,
        })
    }

    /**
     * Overrides react-date-picker's clear input handler to also clear our local input value states.
     */
    handleClearClick = ({ isStartDate }) => event => {
        event.preventDefault()
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'
        const refKey = isStartDate ? 'startDatePicker' : 'endDatePicker'

        // Update both states
        this[refKey].props.onChange(null, event)
        this.setState(state => ({ ...state, [stateKey]: '' }))
    }

    /**
     * Overrides react-date-picker's input keydown handler to search on Enter key press.
     */
    handleKeydown = ({ isStartDate }) => event => {
        if (event.key === 'Enter') {
            event.stopImmediatePropagation()
            this.handleInputChange({ isStartDate })()
        }
    }

    /**
     * Attempts to parse the current date input value state to convert it from natural language
     * date queries (like "yesterday" or "5 days ago") into epoch time.
     * @param {boolean} isStartDate
     * @returns {number|null} Converted epoch time value or null if query could not be converted.
     */
    parsePlainTextDate({ isStartDate }) {
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'
        const dateState = isStartDate
            ? this.state.startDateText
            : this.state.endDateText

        const nlpDate = chrono.parseDate(dateState)

        analytics.trackEvent({
            category: isStartDate ? 'Overview start date' : 'Overview end date',
            action: nlpDate ? 'Successful NLP query' : 'Unsuccessful NLP query',
        })

        // Get the time from the NLP query, if it could be parsed
        if (nlpDate != null) {
            return nlpDate.getTime()
        }

        // Reset input value state as NLP value invalid
        this.setState(state => ({ ...state, [stateKey]: '' }))
        return null
    }

    /**
     * Runs against text input state, to attempt to parse a date string or natural language date.
     */
    handleInputChange = ({ isStartDate }) => () => {
        const currentDate = isStartDate
            ? this.props.startDate
            : this.props.endDate
        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange
        const dateState = isStartDate
            ? this.state.startDateText
            : this.state.endDateText

        let dateToChange
        const date = moment(dateState, FORMAT, true)

        // If moment date is invalid, try the NLP parsing value
        if (!date.isValid()) {
            dateToChange = this.parsePlainTextDate({ isStartDate })
        } else {
            // If end date, we want to search back from end of day
            if (!isStartDate && date != null) {
                date.endOf('day')
            }

            dateToChange = date.valueOf()
        }

        // Trigger state update only if value was parsed and there is a change from current state
        if (
            dateToChange != null &&
            dateToChange !== currentDate &&
            date.format(FORMAT) !== dateState
        ) {
            updateDate(dateToChange)
        }
    }

    /**
     * Runs against raw text input to update value state in realtime
     */
    handleRawInputChange = ({ isStartDate }) => event => {
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'

        const input = event.target
        this.setState(state => ({ ...state, [stateKey]: input.value }))
    }

    /**
     * Runs against date selected in the date dropdown component.
     */
    handleDateChange = ({ isStartDate }) => date => {
        analytics.trackEvent({
            category: isStartDate ? 'Overview start date' : 'Overview end date',
            action: date ? 'Date selection' : 'Date clear',
        })

        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'

        this.setState(state => ({
            ...state,
            [stateKey]: date ? date.format(FORMAT) : null,
        }))

        // If end date, we want to search back from end of day
        if (!isStartDate && date != null) {
            date.endOf('day')
        }

        updateDate(date ? date.valueOf() : undefined)
    }

    render() {
        const { startDate, endDate, disabled } = this.props

        return (
            <div className={styles.dateRangeSelection}>
                <DatePicker
                    ref={dp => {
                        this.startDatePicker = dp
                    }}
                    className={styles.datePicker}
                    dateFormat={FORMAT}
                    placeholderText="after..."
                    isClearable
                    selected={startDate && moment(startDate)}
                    selectsStart
                    disabledKeyboardNavigation
                    startDate={moment(startDate)}
                    endDate={moment(endDate)}
                    maxDate={moment()}
                    onChange={this.handleDateChange({ isStartDate: true })}
                    onChangeRaw={this.handleRawInputChange({
                        isStartDate: true,
                    })}
                    onBlur={this.handleInputChange({ isStartDate: true })}
                    value={this.state.startDateText}
                    disabled={disabled}
                />
                <img src="/img/to-icon.png" className={styles.toIcon} />
                <DatePicker
                    ref={dp => {
                        this.endDatePicker = dp
                    }}
                    className={styles.datePicker}
                    dateFormat={FORMAT}
                    placeholderText="before..."
                    isClearable
                    selected={endDate && moment(endDate)}
                    selectsEnd
                    startDate={moment(startDate)}
                    endDate={moment(endDate)}
                    maxDate={moment()}
                    disabledKeyboardNavigation
                    onChange={this.handleDateChange({ isStartDate: false })}
                    onChangeRaw={this.handleRawInputChange({
                        isStartDate: false,
                    })}
                    onBlur={this.handleInputChange({ isStartDate: false })}
                    value={this.state.endDateText}
                    disabled={disabled}
                />
            </div>
        )
    }
}

export default DateRangeSelection

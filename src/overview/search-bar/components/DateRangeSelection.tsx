import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import chrono from 'chrono-node'
import classnames from 'classnames'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import analytics from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import { DATE_PICKER_DATE_FORMAT as FORMAT } from '../constants'
const styles = require('./DateRangeSelection.css')
import './datepicker-overrides.css'
import { EVENT_NAMES } from '../../../analytics/internal/constants'
import DatePickerInput from './datepicker-input'

const processEvent = remoteFunction('processEvent')
// const stylesPro = require('../../tooltips/components/tooltip.css')

interface Props {
    env: 'inpage' | 'overview'
    startDate: number
    startDateText: string
    endDate: number
    endDateText: string
    onStartDateChange: (...args) => void
    onStartDateTextChange: (...args) => void
    onEndDateChange: (...args) => void
    onEndDateTextChange: (...args) => void
    disabled: boolean
    changeTooltip: (...args) => void
}
class DateRangeSelection extends Component<Props> {
    startDatePicker: any
    endDatePicker: any

    state = {
        startDateText: this.props.startDate
            ? moment(this.props.startDate).format(FORMAT)
            : '',
        endDateText: this.props.endDate
            ? moment(this.props.endDate).format(FORMAT)
            : '',
    }

    componentDidMount() {
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
        const updateDateText = isStartDate
            ? this.props.onStartDateTextChange
            : this.props.onEndDateTextChange

        // Update both states
        this[refKey].props.onChange(null, event)
        this.setState(state => ({ ...state, [stateKey]: '' }))
        updateDateText('')
    }

    /**
     * Overrides react-date-picker's input keydown handler to search on Enter key press.
     */
    handleKeydown = ({ isStartDate }) => event => {
        if (
            this.props.env === 'inpage' &&
            !(event.ctrlKey || event.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(event.keyCode))
        ) {
            event.preventDefault()
            event.stopPropagation()
            const stateKey = isStartDate ? 'startDateText' : 'endDateText'
            const updateDateText = isStartDate
                ? this.props.onStartDateTextChange
                : this.props.onEndDateTextChange

            this.setState(state => ({
                ...state,
                [stateKey]: state[stateKey] + event.key,
            }))

            updateDateText(this.state[stateKey] + event.key)

            return
        }
        if (event.key === 'Enter') {
            // event.stopImmediatePropagation()
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

        processEvent({
            type: isStartDate
                ? EVENT_NAMES.DATEPICKER_NLP_START_DATE
                : EVENT_NAMES.DATEPICKER_NLP_END_DATE,
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
        const updateDateText = isStartDate
            ? this.props.onStartDateTextChange
            : this.props.onEndDateTextChange

        const input = event.target
        updateDateText(input.value)
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

        processEvent({
            type: date
                ? isStartDate
                    ? EVENT_NAMES.DATEPICKER_DROPDOWN_START
                    : EVENT_NAMES.DATEPICKER_DROPDOWN_END
                : isStartDate
                    ? EVENT_NAMES.DATEPICKER_CLEAR_START
                    : EVENT_NAMES.DATEPICKER_CLEAR_END,
        })

        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange

        const updateDateText = isStartDate
            ? this.props.onStartDateTextChange
            : this.props.onEndDateTextChange

        const stateKey = isStartDate ? 'startDateText' : 'endDateText'

        updateDateText(date ? date.format(FORMAT) : '')

        this.setState(state => ({
            ...state,
            [stateKey]: date ? date.format(FORMAT) : null,
        }))

        // If end date, we want to search back from end of day
        if (!isStartDate && date != null) {
            date.endOf('day')
        }

        updateDate(date ? date.valueOf() : undefined)

        // Change onboarding tooltip to more filters
        this.props.changeTooltip()
    }

    render() {
        const {
            startDate,
            endDate,
            disabled,
            startDateText,
            endDateText,
        } = this.props

        return (
            <div className={styles.dateRangeDiv}>
                {/* <div className={styles.dateRangeSelection} id="date-picker">
                    <img src="/img/to-icon.png" className={styles.toIcon} />
                </div> */}
                <div
                    className={classnames(
                        styles.pickerContainer,
                        styles.borderRight,
                    )}
                >
                    <div className={styles.dateTitleContainer}>
                        <span className={styles.dateTitle}>From</span>
                        <DatePickerInput
                            placeholder="🕒 type time..."
                            value={startDateText}
                            name="from"
                            onChange={this.handleRawInputChange({
                                isStartDate: true,
                            })}
                            onSearchEnter={this.handleKeydown({
                                isStartDate: true,
                            })}
                            disabled={disabled}
                            clearFilter={this.handleClearClick({
                                isStartDate: true,
                            })}
                        />
                    </div>
                    <div className={styles.datePickerDiv}>
                        <DatePicker
                            ref={dp => {
                                this.startDatePicker = dp
                            }}
                            className={styles.datePicker}
                            dateFormat={FORMAT}
                            isClearable
                            selected={startDate && moment(startDate)}
                            selectsStart
                            disabledKeyboardNavigation
                            startDate={moment(startDate)}
                            endDate={moment(endDate)}
                            maxDate={moment()}
                            onChange={this.handleDateChange({
                                isStartDate: true,
                            })}
                            inline
                        />
                    </div>
                </div>
                <div className={styles.pickerContainer}>
                    <div className={styles.dateTitleContainer}>
                        <span className={styles.dateTitle}>To</span>
                        <DatePickerInput
                            placeholder="🕒 type time..."
                            value={endDateText}
                            name="to"
                            onChange={this.handleRawInputChange({
                                isStartDate: false,
                            })}
                            onSearchEnter={this.handleKeydown({
                                isStartDate: false,
                            })}
                            disabled={disabled}
                            clearFilter={this.handleClearClick({
                                isStartDate: false,
                            })}
                        />
                    </div>
                    <div className={styles.datePickerDiv}>
                        <DatePicker
                            ref={dp => {
                                this.endDatePicker = dp
                            }}
                            className={styles.datePicker}
                            dateFormat={FORMAT}
                            isClearable
                            selected={endDate && moment(endDate)}
                            selectsEnd
                            startDate={moment(startDate)}
                            endDate={moment(endDate)}
                            maxDate={moment()}
                            disabledKeyboardNavigation
                            onChange={this.handleDateChange({
                                isStartDate: false,
                            })}
                            inline
                        />
                    </div>
                </div>
                {/*                <div className={stylesPro.proTipBox}>
                    <span className={stylesPro.emoji}>🤓</span>
                    <span className={stylesPro.proTip}>PRO Tip: </span>
                    <span className={stylesPro.noBold}>type </span>
                    <span className={stylesPro.example}>e.g. "1 hour ago"</span>
                </div> */}
            </div>
        )
    }
}

export default DateRangeSelection

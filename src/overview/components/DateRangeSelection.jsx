import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import chrono from 'chrono-node'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import styles from './DateRangeSelection.css'
import './datepicker-overrides.css'

class DateRangeSelection extends Component {
    constructor() {
        super()

        this.state = {
            startDateText: null,
            endDateText: null,
        }

        this.handleKeydown = this.handleKeydown.bind(this)
        this.submitDateChange = this.submitDateChange.bind(this)
    }

    componentDidMount() {
        this.startDateDatePicker.refs.input.refs.input.addEventListener('keydown', e => this.handleKeydown(e, 'startDate'))
        this.endDateDatePicker.refs.input.refs.input.addEventListener('keydown', e => this.handleKeydown(e, 'endDate'))
    }

    handleKeydown(event, type) {
        if (event.key === 'Enter') {
            event.stopImmediatePropagation()
            this.submitDateChange(type)
        }
    }

    submitDateChange(type) {
        const onDateChange = (dateText, currentDate, updateDate) => {
            const date = moment(dateText, 'DD-MM-YYYY', true)
            const nlpDate = chrono.parseDate(dateText)

            const dateToChange = date.isValid()
                ? date.valueOf()
                : nlpDate && nlpDate.getTime()

            if (dateToChange !== currentDate) updateDate(dateToChange || undefined)
        }

        return type === 'startDate'
            ? onDateChange(this.state.startDateText, this.props.startDate, this.props.onStartDateChange)
            : onDateChange(this.state.endDateText, this.props.endDate, this.props.onEndDateChange)
    }

    render() {
        const {
            startDate, endDate,
            onStartDateChange, onEndDateChange,
        } = this.props

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
                    onChange={date => {
                        // Syncs the change of date to state
                        this.setState({
                            startDateText: date ? date.format('DD-MM-YYYY') : null,
                        })

                        onStartDateChange(
                            date ? date.valueOf() : undefined,
                        )
                    }}
                    onChangeRaw={e => {
                        this.setState({ startDateText: e.target.value })
                    }}
                    onBlur={() => this.submitDateChange('startDate')}
                />
                <img
                    src='img/to-icon.png'
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
                    onChange={date => {
                        // Syncs the change of end date to state
                        this.setState({
                            endDateText: date ? date.format('DD-MM-YYYY') : null,
                        })

                        onEndDateChange(
                            date ? date.valueOf() : undefined,
                        )
                    }}
                    onChangeRaw={e => {
                        this.setState({ endDateText: e.target.value })
                    }}
                    onBlur={() => this.submitDateChange('endDate')}
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

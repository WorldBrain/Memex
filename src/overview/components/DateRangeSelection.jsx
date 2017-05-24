import React, { Component, PropTypes } from 'react'
import moment from 'moment'
import chrono from 'chrono-node'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import styles from './DateRangeSelection.css'


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
        this.refs.startDateDatePicker.refs.input.refs.input.addEventListener('keydown', e => this.handleKeydown(e, 'startDate'))
        this.refs.endDateDatePicker.refs.input.refs.input.addEventListener('keydown', e => this.handleKeydown(e, 'endDate'))
    }

    handleKeydown(event, type) {
        if (event.key === 'Enter') {
            event.stopImmediatePropagation()
            this.submitDateChange(type)
        }
    }

    submitDateChange(type) {
        if (type === 'startDate') {
            console.log('hrere')
            const date = moment(this.state.startDateText, 'DD-MM-YYYY')
            const nlpDate = chrono.parseDate(this.state.startDateText)

            const dateToChange = date.isValid()
                ? date.valueOf()
                : nlpDate && nlpDate.getTime()

            if (dateToChange !== this.props.startDate) this.props.onStartDateChange(dateToChange)
        } else if (type === 'endDate') {
            const date = moment(this.state.endDateText, 'DD-MM-YYYY')
            const nlpDate = chrono.parseDate(this.state.endDateText)

            const dateToChange = date.isValid()
                ? date.valueOf()
                : nlpDate && nlpDate.getTime()

            if (dateToChange !== this.props.endDate) this.props.onEndDateChange(dateToChange)
        }
    }

    render() {
        const {
            startDate, endDate,
            onStartDateChange, onEndDateChange,
        } = this.props

        return (
            <div className={styles.dateRangeSelection}>
                <DatePicker
                    ref='startDateDatePicker'
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
                <DatePicker
                    ref='endDateDatePicker'
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

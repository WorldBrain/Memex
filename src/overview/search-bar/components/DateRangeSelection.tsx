import React, { Component } from 'react'
import moment from 'moment'
import chrono from 'chrono-node'
import classnames from 'classnames'
import DatePicker from 'react-datepicker'
import analytics from 'src/analytics'
import { DATE_PICKER_DATE_FORMAT as FORMAT } from 'src/dashboard-refactor/constants'
import DatePickerInput from './datepicker-input'
import styled from 'styled-components'
import { formatTimestamp } from '@worldbrain/memex-common/lib/utils/date-time'
import { browser } from 'webextension-polyfill-ts'

export interface DateRangeSelectionProps {
    env?: 'inpage' | 'overview'
    startDate: number
    startDateText: string
    endDate: number
    endDateText: string
    disabled?: boolean
    onClickOutside?: React.MouseEventHandler
    onStartDateChange: (...args) => void
    onStartDateTextChange: (...args) => void
    onEndDateChange: (...args) => void
    onEndDateTextChange: (...args) => void
    changeTooltip?: (...args) => void
}

const arrowDown = browser.runtime.getURL('/img/arrowDown.svg')

class DateRangeSelection extends Component<DateRangeSelectionProps> {
    static defaultProps: Partial<DateRangeSelectionProps> = {
        changeTooltip: () => {},
        env: 'overview',
        disabled: false,
    }

    startDatePicker: any
    endDatePicker: any

    state = {
        startDateText: '',
        endDateText: '',
    }

    componentDidMount() {
        console.log('DateRangeSelection mounted', arrowDown)
        // Override clear button handlers
        this.startDatePicker.onClearClick = this.handleClearClick({
            isStartDate: true,
        })
        this.endDatePicker.onClearClick = this.handleClearClick({
            isStartDate: false,
        })

        this.setState({
            startDateText: this.props.startDate
                ? formatTimestamp(this.props.startDate, FORMAT)
                : '',
            endDateText: this.props.endDate
                ? formatTimestamp(this.props.endDate, FORMAT)
                : '',
        })
    }

    handleClickOutside = (e) => {
        if (this.props.onClickOutside) {
            this.props.onClickOutside(e)
        }
    }

    /**
     * Overrides react-date-picker's clear input handler to also clear our local input value states.
     */
    handleClearClick = ({ isStartDate }) => (event) => {
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'
        const refKey = isStartDate ? 'startDatePicker' : 'endDatePicker'
        const updateDateText = isStartDate
            ? this.props.onStartDateTextChange
            : this.props.onEndDateTextChange
        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange

        // Update both states
        this[refKey].props.onChange(null, event)
        this.setState((state) => ({ ...state, [stateKey]: '' }))
        updateDateText('')
        updateDate('')

        event.preventDefault()
    }

    /**
     * Overrides react-date-picker's input keydown handler to search on Enter key press.
     */
    handleKeydown = ({ isStartDate }) => (event) => {
        if (
            this.props.env === 'inpage' &&
            !(event.ctrlKey || event.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(event.keyCode))
        ) {
            event.preventDefault()
            event.stopPropagation()
            this.handleRawInputChange({ isStartDate })(event)
            return
        }
        if (event.key === 'Enter') {
            // event.stopImmediatePropagation()
            this.handleInputChange({ isStartDate })()
        }
        if (event.key === 'Escape') {
            // event.stopImmediatePropagation()
            this.props.onClickOutside(event)
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

        let action

        if (nlpDate && isStartDate) {
            action = 'addStartDateFilterViaQuery'
        } else if (nlpDate && !isStartDate) {
            action = 'addEndDateFilterViaQuery'
        } else {
            action = 'addInvalidDateFilterQuery'
        }

        analytics.trackEvent({ category: 'SearchFilters', action })

        // Get the time from the NLP query, if it could be parsed
        if (nlpDate != null && nlpDate !== '') {
            return nlpDate.getTime()
        }

        // Reset input value state as NLP value invalid
        this.setState((state) => ({ ...state, [stateKey]: '' }))
        return null
    }

    /**
     * Runs against text input state, to attempt to parse a date string or natural language date.
     */
    handleInputChange = ({ isStartDate }) => () => {
        const currentDate = isStartDate
            ? this.props.startDate
            : this.props.endDate
        const dateState = isStartDate
            ? this.state.startDateText
            : this.state.endDateText
        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange

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
    handleRawInputChange = ({ isStartDate }) => (event) => {
        const stateKey = isStartDate ? 'startDateText' : 'endDateText'
        const input = event.target
        this.setState((state) => ({ ...state, [stateKey]: input.value }))
        if (event.target.value.length === 0) {
            this.handleClearClick({ isStartDate })(event)
        }
    }

    /**
     * Runs against date selected in the date dropdown component.
     */
    handleDateChange = ({ isStartDate }) => (date) => {
        let action
        // tslint:disable-next-line
        if (date) {
            action = isStartDate
                ? 'addStartDateFilterViaPicker'
                : 'addEndDateFilterViaPicker'
        } else {
            action = isStartDate ? 'clearStartDateFilter' : 'clearEndDateFilter'
        }
        analytics.trackEvent({ category: 'SearchFilters', action })

        const updateDate = isStartDate
            ? this.props.onStartDateChange
            : this.props.onEndDateChange

        const updateDateText = isStartDate
            ? this.props.onStartDateTextChange
            : this.props.onEndDateTextChange

        const stateKey = isStartDate ? 'startDateText' : 'endDateText'

        let newDate = date ? date : null
        if (!isStartDate && date != null) {
            newDate = date.endOf('day')
        }

        updateDateText(newDate ? newDate.format(FORMAT) : '')

        this.setState((state) => ({
            ...state,
            [stateKey]: newDate ? newDate.format(FORMAT) : null,
        }))

        // If end date, we want to search back from end of day

        updateDate(newDate ? newDate.valueOf() : undefined)

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
            <DateRangeDiv>
                {/* <div className={styles.dateRangeSelection} id="date-picker">
                    <img src="/img/to-icon.png" className={styles.toIcon} />
                </div> */}
                <PickerContainer>
                    <DateTitleContainer>
                        <DateTitle>From</DateTitle>
                        <DatePickerInput
                            autoFocus
                            value={this.state.startDateText}
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
                    </DateTitleContainer>
                    <DatePickerDiv>
                        <DatePicker
                            ref={(dp) => {
                                this.startDatePicker = dp
                            }}
                            dateFormat={FORMAT}
                            isClearable
                            selected={startDate && moment(startDate)}
                            disabledKeyboardNavigation
                            maxDate={moment(endDate)}
                            onChange={this.handleDateChange({
                                isStartDate: true,
                            })}
                            inline
                        />
                    </DatePickerDiv>
                </PickerContainer>
                <PickerContainer>
                    <DateTitleContainer>
                        <DateTitle>To</DateTitle>
                        <DatePickerInput
                            value={this.state.endDateText}
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
                    </DateTitleContainer>
                    <DatePickerDiv>
                        <DatePicker
                            ref={(dp) => {
                                this.endDatePicker = dp
                            }}
                            dateFormat={FORMAT}
                            isClearable
                            selected={endDate && moment(endDate)}
                            minDate={startDate && moment(startDate)}
                            maxDate={moment()}
                            disabledKeyboardNavigation
                            onChange={this.handleDateChange({
                                isStartDate: false,
                            })}
                            inline
                        />
                    </DatePickerDiv>
                </PickerContainer>
            </DateRangeDiv>
        )
    }
}

const DateRangeDiv = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.greyScale1};
    align-items: flex-start;
    border-radius: 12px;

    .react-datepicker {
    }

    .react-datepicker__current-month {
        color: ${(props) => props.theme.colors.white};
        font-weight: bold;
    }

    .react-datepicker__header .react-datepicker__day-name {
        color: ${(props) => props.theme.colors.greyScale5};
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }

    .react-datepicker__day--outside-month {
        color: ${(props) => props.theme.colors.greyScale6} !important;
        font-weight: 300 !important;
    }

    .react-datepicker__day--disabled {
        color: ${(props) =>
            props.theme.variant === 'light'
                ? props.theme.colors.greyScale4
                : props.theme.colors.greyScale6} !important;
        font-weight: 300 !important;
    }

    .react-datepicker__day--selected {
        background: ${(props) => props.theme.colors.prime1} !important;
        border-radius: 3px;
        color: ${(props) => props.theme.colors.black} !important;
    }

    .react-datepicker__day {
        color: ${(props) => props.theme.colors.white};
        font-weight: bold;

        &:hover {
            border-radius: 3px;
            color: ${(props) => props.theme.colors.white};
            background: ${(props) => props.theme.colors.greyScale2};
        }
    }
`

const DateTitle = styled.span`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 600;
`

const ToIcon = styled.div`
    width: 5px;
    height: 8px;
    margin-top: 1px;
`

const PickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 10px 15px 0px;
    background: ${(props) => props.theme.colors.greyScale1};
    border-radius: 20px;
`

const ClearFilters = styled.div`
    background-image: url('/img/removeIcon.svg');
    background-size: 10px;
    background-repeat: no-repeat;
    cursor: pointer;
    width: 20px;
    height: 20px;
    margin-left: 5px;
    outline: none;
    border: none;
`

const DateTitleContainer = styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1;
`

const DatepickerInput = styled.div`
    display: flex;
    align-items: center;
`

const BorderRight = styled.div`
    border-right: 1px solid color9;
`

const DatePickerDiv = styled.div`
    background: transparent;
    margin-top: 10px;

    & div {
        background: transparent;
    }

    .react-datepicker__close-icon::after {
        background-color: #347ae2 !important;
        padding-left: 3px;
        top: 7px;
        padding-top: 2px;
        height: 17px;
        width: 17px;
    }

    .react-datepicker__triangle {
        display: none !important;
    }

    .react-datepicker__month {
        margin: 0px;
        display: flex;
        flex-direction: column;
        grid-gap: 3px;
        margin: 0px;
        justify-content: space-between;
        margin-bottom: 5px;
    }

    .react-datepicker {
        top: -9px !important;
        border: none !important;
        border-radius: 4px !important;
        border-top-left-radius: 0 !important;
        border-top-right-radius: 0 !important;
    }

    .react-datepicker__header {
        border-bottom: none !important;
    }

    .react-datepicker__current-month {
        line-height: 24px !important;
        margin-bottom: 5px !important;
        color: ${(props) =>
            props.theme.variant === 'dark'
                ? props.theme.colors.greyScale5
                : props.theme.colors.greyScale2} !important;
        width: 100% !important;
        display: flex;
        justify-content: center;
    }

    .react-datepicker__navigation {
        border: none;
    }

    .react-datepicker__month-container {
    }

    .react-datepicker__navigation--previous {
        mask-image: url(${arrowDown}) !important;
        transform: rotate(90deg);
        mask-repeat: no-repeat !important;
        mask-size: 24px !important;
        mask-position: center !important;
        height: 24px !important;
        width: 20px !important;
        color: transparent;
        content: '';
        background: ${(props) =>
            props.theme.variant === 'dark'
                ? props.theme.colors.greyScale6
                : props.theme.colors.greyScale2} !important;
    }

    .react-datepicker__navigation--next {
        mask-image: url(${arrowDown}) !important;
        transform: rotate(-90deg);
        mask-repeat: no-repeat !important;
        mask-size: 24px !important;
        mask-position: center !important;
        height: 24px !important;
        color: transparent;
        width: 24px !important;
        content: '';
        background: ${(props) =>
            props.theme.variant === 'dark'
                ? props.theme.colors.greyScale6
                : props.theme.colors.greyScale2} !important;
    }

    .react-datepicker__day {
        margin: 0 !important;
        width: 35px !important;
        line-height: 35px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
    }

    .react-datepicker__day-names {
        display: flex !important;
        justify-content: space-between;
    }

    .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--in-range),
    .react-datepicker__day--in-range {
        border-radius: 0 !important;
        background-color: color1 !important;
    }

    .react-datepicker__day--in-range:hover {
        border-radius: 0 !important;
        background-color: color2 !important;
        opacity: 0.7;
    }

    .react-datepicker__day--selecting-range-start,
    .react-datepicker__day--selecting-range-start:not(.react-datepicker__day--in-range),
    .react-datepicker__day--range-start:not(.react-datepicker__day--in-selecting-range) {
        border-top-left-radius: 50% !important;
        border-bottom-left-radius: 50% !important;
        font-weight: bold;
    }

    .react-datepicker__day--selecting-range-end,
    .react-datepicker__day--selecting-range-end:not(.react-datepicker__day--in-range),
    .react-datepicker__day--range-end:not(.react-datepicker__day--in-selecting-range) {
        border-top-right-radius: 50% !important;
        border-bottom-right-radius: 50% !important;
        font-weight: bold;
    }

    .react-datepicker__day--range-start:hover {
        border-top-left-radius: 50% !important;
        border-bottom-left-radius: 50% !important;
        opacity: 0.7;
    }

    .react-datepicker__day--range-end:hover {
        border-top-right-radius: 50% !important;
        border-bottom-right-radius: 50% !important;
        opacity: 0.7;
    }

    .react-datepicker__week {
        display: flex;
        justify-content: space-between;
    }

    .react-datepicker__week
        > .react-datepicker__day--in-selecting-range:first-of-type,
    .react-datepicker__week > .react-datepicker__day--in-range:first-of-type {
        border-top-left-radius: 3px !important;
        border-bottom-left-radius: 3px !important;
    }

    .react-datepicker__week
        > .react-datepicker__day--in-selecting-range:last-of-type,
    .react-datepicker__week > .react-datepicker__day--in-range:last-of-type {
        border-top-right-radius: 3px !important;
        border-bottom-right-radius: 3px !important;
    }
`

export default DateRangeSelection

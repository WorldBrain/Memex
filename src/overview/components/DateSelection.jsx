import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'semantic-ui-react'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'


const DateSelection = ({
    date,
    onDateChange,
}) => (
    <DatePicker
        customInput={
            <Input
                size='large'
                icon='calendar'
                iconPosition='left'
            />
        }
        dateFormat='DD-MM-YYYY'
        placeholderText='jump to date…'
        isClearable
        selected={date && moment(date)}
        openToDate={(date && moment(date)) || moment()}
        selectsEnd
        startDate={moment(0)}
        endDate={moment(date)}
        maxDate={moment()}
        onChange={date => onDateChange(
            date ? date.endOf('day').valueOf() : undefined,
        )}
    />
)

DateSelection.propTypes = {
    date: PropTypes.number,
    onDateChange: PropTypes.func,
}


export default DateSelection

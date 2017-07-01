import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import styles from './DateSelection.css'


const DateSelection = ({
    date,
    onDateChange,
}) => (
    <div className={styles.dateSelection}>
        <DatePicker
            className={styles.datePicker}
            dateFormat='DD-MM-YYYY'
            placeholderText='📅  jump to date…'
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
    </div>
)

DateSelection.propTypes = {
    date: PropTypes.number,
    onDateChange: PropTypes.func,
}


export default DateSelection

import React from 'react'
import PropTypes from 'prop-types'
import { Input } from 'semantic-ui-react'
import classNames from 'classnames'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

import styles from './DateSelection.css'


const DateSelection = ({
    date,
    onDateChange,
}) => (
    <DatePicker
        // react-datepicker passes this className to the <Input> component.
        className={classNames(
            styles.root,
            {[styles.expanded]: date !== undefined}
        )}
        customInput={
            <Input
                size='huge'
                icon='calendar'
                iconPosition='left'
            />
        }
        disabledKeyboardNavigation={date !== undefined}
        dateFormat='DD-MM-YYYY'
        placeholderText='jump to date…'
        isClearable
        selected={date && moment(date)}
        openToDate={(date && moment(date)) || moment()}
        maxDate={moment()}
        onChange={date => onDateChange(
            date ? date.endOf('day').valueOf() : undefined,
        )}
        popoverTargetAttachment='bottom right'
        popoverAttachment='top right'
    />
)

DateSelection.propTypes = {
    date: PropTypes.number,
    onDateChange: PropTypes.func,
}


export default DateSelection

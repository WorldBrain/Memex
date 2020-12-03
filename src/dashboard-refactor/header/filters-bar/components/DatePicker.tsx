import React, { PureComponent } from 'react'
import DateRangeSelection, {
    Props as DateRangeSelectionProps,
} from 'src/overview/search-bar/components/DateRangeSelection'

export default class DatePicker extends PureComponent<DateRangeSelectionProps> {
    render() {
        const {
            env,
            startDate,
            endDate,
            startDateText,
            endDateText,
            onStartDateChange,
            onEndDateChange,
            onStartDateTextChange,
            onEndDateTextChange,
            changeTooltip,
            disabled,
        } = this.props
        return (
            <DateRangeSelection
                env={env}
                startDate={startDate}
                endDate={endDate}
                startDateText={startDateText}
                endDateText={endDateText}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                onStartDateTextChange={onStartDateTextChange}
                onEndDateTextChange={onEndDateTextChange}
                disabled={disabled}
                changeTooltip={changeTooltip}
            />
        )
    }
}

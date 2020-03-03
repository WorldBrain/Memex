import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'
import { RootState } from 'src/options/types'

import { Tooltip } from 'src/common-ui/components'
import DateRangeSelection from 'src/overview/search-bar/components/DateRangeSelection'
import FilterButton from './filter-button'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'
import * as tooltipActs from 'src/overview/tooltips/actions'

import cx from 'classnames'

const styles = require('./dates-filter.css')

interface StateProps {
    startDate: number
    endDate: number
    startDateText: string
    endDateText: string
    datesFilterDropdown: boolean
}

interface DispatchProps {
    setDatesFilter: (value: boolean) => void
    onStartDateChange: (date: number) => void
    onEndDateChange: (date: number) => void
    onStartDateTextChange: (date: string) => void
    onEndDateTextChange: (date: string) => void
    changeTooltip: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class DatesFilter extends PureComponent<Props, State> {
    private togglePopup: React.MouseEventHandler<HTMLButtonElement> = e => {
        if (this.props.env === 'inpage' && !this.props.datesFilterDropdown) {
            this.props.resetFilterPopups()
        }

        this.props.datesFilterDropdown
            ? this.props.setDatesFilter(false)
            : this.props.setDatesFilter(true)
    }

    clearFilters = () => {
        this.props.onStartDateChange(undefined)
        this.props.onEndDateChange(undefined)
        this.props.onStartDateTextChange('')
        this.props.onEndDateTextChange('')
    }

    render() {
        return (
            <FilterButton
                env={this.props.env}
                source="Dates"
                filteredItems={[]}
                togglePopup={this.togglePopup}
                showPopup={this.props.setDatesFilter}
                clearFilters={this.clearFilters}
                startDate={this.props.startDate}
                endDate={this.props.endDate}
                disableOnClickOutside={this.props.env === 'inpage'}
            >
                {this.props.datesFilterDropdown && (
                    <Tooltip
                        position={this.props.tooltipPosition}
                        itemClass={cx({
                            [styles.tooltip]: this.props.env === 'overview',
                            [styles.inpagetooltip]: this.props.env === 'inpage',
                        })}
                    >
                        <DateRangeSelection
                            env={this.props.env}
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            startDateText={this.props.startDateText}
                            endDateText={this.props.endDateText}
                            onStartDateChange={this.props.onStartDateChange}
                            onEndDateChange={this.props.onEndDateChange}
                            onStartDateTextChange={
                                this.props.onStartDateTextChange
                            }
                            onEndDateTextChange={this.props.onEndDateTextChange}
                            disabled={false}
                            changeTooltip={this.props.changeTooltip}
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    startDate: searchBar.startDate(state),
    endDate: searchBar.endDate(state),
    startDateText: searchBar.startDateText(state),
    endDateText: searchBar.endDateText(state),
    datesFilterDropdown: selectors.datesFilter(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
    onStartDateChange: date => dispatch(searchBarActs.setStartDate(date)),
    onEndDateChange: date => dispatch(searchBarActs.setEndDate(date)),
    onStartDateTextChange: date =>
        dispatch(searchBarActs.setStartDateText(date)),
    onEndDateTextChange: date => dispatch(searchBarActs.setEndDateText(date)),
    setDatesFilter: value => dispatch(actions.setDatesFilter(value)),
    changeTooltip: () => {
        // Change tooltip notification to more filters once the user selects date
        dispatch(tooltipActs.setTooltip('more-filters'))
    },
    resetFilterPopups: () => dispatch(actions.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(DatesFilter)

import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { actions, selectors } from 'src/search-filters'
import { Tooltip } from 'src/common-ui/components'
import DateRangeSelection from 'src/overview/search-bar/components/DateRangeSelection'
import FilterButton from './filter-button'
import {
    acts as searchBarActs,
    selectors as searchBar,
} from 'src/overview/search-bar'
import cx from 'classnames'
import styles from './dates-filter.css'

class DatesFilter extends PureComponent {
    static propTypes = {
        env: PropTypes.oneOf(['overview', 'inpage']).isRequired,
        startDate: PropTypes.number,
        endDate: PropTypes.number,
        datesFilterDropdown: PropTypes.bool.isRequired,
        tooltipPosition: PropTypes.string.isRequired,
        showDatesFilter: PropTypes.func.isRequired,
        hideDatesFilter: PropTypes.func.isRequired,
        onStartDateChange: PropTypes.func.isRequired,
        onEndDateChange: PropTypes.func.isRequired,
    }

    togglePopup = () => {
        this.props.datesFilterDropdown
            ? this.props.hideDatesFilter()
            : this.props.showDatesFilter()
    }

    clearFilters = () => {
        this.props.onStartDateChange(undefined)
        this.props.onEndDateChange(undefined)
    }

    render() {
        return (
            <FilterButton
                source="Dates"
                filteredItems={[]}
                togglePopup={this.togglePopup}
                hidePopup={this.props.hideDatesFilter}
                clearFilters={this.clearFilters}
                startDate={this.props.startDate}
                endDate={this.props.endDate}
            >
                {this.props.datesFilterDropdown && (
                    <Tooltip
                        position={this.props.tooltipPosition}
                        itemClass={cx({
                            [styles.tooltip]: this.props.env === 'overview',
                        })}
                    >
                        <DateRangeSelection
                            env={this.props.env}
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            onStartDateChange={this.props.onStartDateChange}
                            onEndDateChange={this.props.onEndDateChange}
                            disabled={false}
                            changeTooltip={() => {}}
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps = state => ({
    startDate: searchBar.startDate(state),
    endDate: searchBar.endDate(state),
    datesFilterDropdown: selectors.datesFilter(state),
})

const mapDispatchToProps = dispatch => ({
    onStartDateChange: date => dispatch(searchBarActs.setStartDate(date)),
    onEndDateChange: date => dispatch(searchBarActs.setEndDate(date)),
    showDatesFilter: () => dispatch(actions.showDatesFilter()),
    hideDatesFilter: () => dispatch(actions.hideDatesFilter()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DatesFilter)

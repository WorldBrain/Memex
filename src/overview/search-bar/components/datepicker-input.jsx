import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styles from './DateRangeSelection.css'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

class DatePickerInput extends PureComponent {
    static propTypes = {
        value: PropTypes.string,
        placeholder: PropTypes.string,
        name: PropTypes.string,
        onChange: PropTypes.func,
        onSearchEnter: PropTypes.func,
        clearFilter: PropTypes.func,
        disabled: PropTypes.bool,
        autoFocus: PropTypes.bool,
    }
    render() {
        return (
            <div className={styles.datepickerInput}>
                <ButtonTooltip
                    tooltipText="You can also type e.g. 'last Friday 10am'"
                    position="bottom"
                >
                    <input
                        name={this.props.name}
                        value={this.props.value}
                        placeholder={this.props.placeholder}
                        onChange={(e) => this.props.onChange(e)}
                        onKeyDown={(e) => this.props.onSearchEnter(e)}
                        disabled={this.props.disabled}
                        className={styles.timeInput}
                        autoFocus={this.props.autoFocus}
                    />
                </ButtonTooltip>
                {this.props.value && (
                    <ButtonTooltip
                        tooltipText="Clear Selection"
                        position="bottom"
                    >
                        <button
                            className={styles.clearFilters}
                            onClick={(e) => this.props.clearFilter(e)}
                        />
                    </ButtonTooltip>
                )}
            </div>
        )
    }
}

export default DatePickerInput

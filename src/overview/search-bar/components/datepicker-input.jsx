import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styles from './DateRangeSelection.css'

class DatePickerInput extends PureComponent {
    static propTypes = {
        value: PropTypes.string,
        placeholder: PropTypes.string,
        name: PropTypes.string,
        onChange: PropTypes.func,
        onSearchEnter: PropTypes.func,
        clearFilter: PropTypes.func,
        disabled: PropTypes.bool,
    }
    render() {
        return (
            <div>
                <input
                    name={this.props.name}
                    value={this.props.value}
                    placeholder={this.props.placeholder}
                    onChange={e => this.props.onChange(e)}
                    onKeyDown={e => this.props.onSearchEnter(e)}
                    disabled={this.props.disabled}
                />
                {this.props.value && (
                    <button
                        className={styles.clearFilters}
                        onClick={e => this.props.clearFilter(e)}
                    />
                )}
            </div>
        )
    }
}

export default DatePickerInput

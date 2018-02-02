import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './Switch.css'

class Switch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
        labelClass: PropTypes.string,
        activeLabelClass: PropTypes.string,
        inputClass: PropTypes.string,
    }

    static defaultProps = {
        labelClass: localStyles.switch,
        activeLabelClass: localStyles.activeSwitch,
        inputClass: localStyles.input,
    }

    render() {
        return (
            <label
                className={cx(this.props.labelClass, {
                    [this.props.activeLabelClass]: this.props.isChecked,
                })}
            >
                <input
                    className={this.props.inputClass}
                    type="checkbox"
                    checked={this.props.isChecked}
                    onChange={this.props.onChange}
                />
            </label>
        )
    }
}

export default Switch

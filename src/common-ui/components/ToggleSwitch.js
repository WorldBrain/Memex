import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './ToggleSwitch.css'

class ToggleSwitch extends Component {
    static propTypes = {
        isChecked: PropTypes.bool,
        onChange: PropTypes.func.isRequired,
        className: PropTypes.string,
        activeClassName: PropTypes.string,
        defaultValue: PropTypes.bool,
    }

    static defaultProps = {
        className: localStyles.switch,
        activeClassName: localStyles.activeSwitch,
        defaultValue: false,
    }

    constructor(props) {
        super(props)

        this.state = {
            isChecked: props.isChecked || props.defaultValue,
        }
    }

    get isControlled() {
        return this.props.isChecked != null
    }

    get isCheckedValue() {
        return this.isControlled ? this.props.isChecked : this.state.isChecked
    }

    deriveClass = () =>
        cx(this.props.className, {
            [this.props.activeClassName]:
                this.props.isChecked || this.state.isChecked,
        })

    handleClick = event => {
        this.props.onChange(!this.isCheckedValue)

        if (!this.isControlled) {
            this.setState(state => ({
                ...state,
                isChecked: !this.isCheckedValue,
            }))
        }
    }

    render() {
        return (
            <label className={this.deriveClass()}>
                <input
                    className={localStyles.input}
                    checked={this.isCheckedValue}
                    onChange={this.handleClick}
                    type="checkbox"
                />
            </label>
        )
    }
}

export default ToggleSwitch

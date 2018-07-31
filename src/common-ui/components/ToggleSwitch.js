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

    deriveClass = () =>
        cx(this.props.className, {
            [this.props.activeClassName]:
                this.props.isChecked || this.state.isChecked,
        })

    handleClick = event => {
        if (this.props.isChecked === true || this.props.isChecked === false) {
            this.props.onChange(!this.props.isChecked)
        } else {
            this.props.onChange(!this.state.isChecked)

            this.setState(state => ({
                ...state,
                isChecked: !this.state.isChecked,
            }))
        }
    }

    render() {
        const isUncontrolled =
            this.props.isChecked === true || this.props.isChecked === false

        return (
            <label className={this.deriveClass()}>
                <input
                    className={localStyles.input}
                    checked={
                        !isUncontrolled ? this.state.isChecked : isUncontrolled
                    }
                    onChange={this.handleClick}
                    type="checkbox"
                />
            </label>
        )
    }
}

export default ToggleSwitch

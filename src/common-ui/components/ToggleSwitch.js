import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './ToggleSwitch.css'

class ToggleSwitch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool,
        onChange: PropTypes.func.isRequired,
        className: PropTypes.string,
        activeClassName: PropTypes.string,
    }

    static defaultProps = {
        className: localStyles.switch,
        activeClassName: localStyles.activeSwitch,
        isChecked: false,
    }

    constructor(props) {
        super(props)

        this.state = {
            isChecked: props.isChecked ? props.isChecked : false,
        }
    }

    deriveClass = () =>
        cx(this.props.className, {
            [this.props.activeClassName]:
                this.props.isChecked || this.state.isChecked,
        })

    handleClick = event => {
        this.props.onChange(!this.state.isChecked)

        this.setState(state => ({
            ...state,
            isChecked: !state.isChecked,
        }))
    }

    render() {
        return (
            <label className={this.deriveClass()}>
                <input
                    className={localStyles.input}
                    checked={this.state.isChecked}
                    onChange={this.handleClick}
                    type="checkbox"
                />
            </label>
        )
    }
}

export default ToggleSwitch

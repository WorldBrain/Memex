import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './ToggleSwitch.css'

class ToggleSwitch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
        className: PropTypes.string,
        activeClassName: PropTypes.string,
    }

    static defaultProps = {
        className: localStyles.switch,
        activeClassName: localStyles.activeSwitch,
    }

    constructor(props) {
        super(props)

        this.state = {
            isChecked: props.isChecked,
        }
    }

    deriveClass = () =>
        cx(this.props.className, {
            [this.props.activeClassName]: this.props.isChecked,
        })

    handleClick = event => {
        this.setState(state => ({
            ...state,
            isChecked: !state.isChecked,
        }))

        this.props.onChange()
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

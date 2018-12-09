import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ToggleSwitch.css'

class ToggleSwitch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
        className: PropTypes.string,
        activeClassName: PropTypes.string,
    }

    static defaultProps = {
        className: styles.switch,
        activeClassName: styles.activeSwitch,
    }

    deriveClass = () =>
        cx(this.props.className, {
            [this.props.activeClassName]: this.props.isChecked,
        })

    deriveTextClass = () =>
        cx(styles.text, {
            [styles.activeText]: this.props.isChecked,
        })

    render() {
        return (
            <span>
                <label className={this.deriveClass()}>
                    <input
                        className={styles.input}
                        checked={this.props.isChecked}
                        onChange={this.props.onChange}
                        type="checkbox"
                    />
                </label>
                <span
                    className={this.deriveTextClass()}
                    onClick={this.props.onChange}
                >
                    {this.props.isChecked ? 'On' : 'Off'}
                </span>
                <p className={styles.subTitle}>on all pages</p>
            </span>
        )
    }
}

export default ToggleSwitch

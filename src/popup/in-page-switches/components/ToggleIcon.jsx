import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ToggleIcon.css'

class ToggleSwitch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
        title: PropTypes.string.isRequired,
        className: PropTypes.oneOfType([
            PropTypes.string.isRequired,
            PropTypes.arrayOf(PropTypes.string),
        ]).isRequired,
        activeClassName: PropTypes.oneOfType([
            PropTypes.string.isRequired,
            PropTypes.arrayOf(PropTypes.string),
        ]).isRequired,
    }

    // static defaultProps = {
    //     className: styles.switch,
    //     activeClassName: styles.activeSwitch,
    // }

    deriveClass = () =>
        cx(
            this.props.className,
            this.props.isChecked && this.props.activeClassName,
        )

    // deriveTextClass = () =>
    //     cx(styles.text, {
    //         [styles.activeText]: this.props.isChecked,
    //     })

    render() {
        return (
            <span>
                <label className={this.deriveClass()} title={this.props.title}>
                    <input
                        className={styles.input}
                        checked={this.props.isChecked}
                        onChange={this.props.onChange}
                        type="checkbox"
                    />
                </label>
            </span>
        )
    }
}

export default ToggleSwitch

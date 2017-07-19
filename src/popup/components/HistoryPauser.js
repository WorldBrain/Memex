import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const iconStyles = classNames('material-icons', styles.clickableIcon)

const HistoryPauser = ({ onConfirm, value, onChange, children, ...selectProps }) => (
    <div className={classNames(styles.item, styles.itemDropdown)}>
        <i className={iconStyles} onClick={onConfirm}>pause_circle_outline</i>
        Pause recording for
        <select className={styles.dropdown} value={value} onChange={onChange} {...selectProps}>
            {children}
        </select>
        mins
    </div>
)

HistoryPauser.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    onConfirm: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
}

export default HistoryPauser

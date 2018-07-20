import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Tooltip.css'

const Tooltip = ({ showTooltip, children }) => {
    return (
        <div className={styles.tooltip}>
            <span
                className={cx(styles.tooltiptext, {
                    [styles.hideTooltip]: !showTooltip,
                })}
            >
                {children}
            </span>
        </div>
    )
}

Tooltip.propTypes = {
    showTooltip: PropTypes.bool.isRequired,
    // Also add support for node
    children: PropTypes.string.isRequired,
}

export default Tooltip

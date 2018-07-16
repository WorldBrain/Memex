import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Tooltip.css'

const Tooltip = ({ showTooltip, content }) => {
    return (
        <div className={styles.tooltip}>
            <span
                className={cx(styles.tooltiptext, {
                    [styles.hideTooltip]: !showTooltip,
                })}
            >
                {content}
            </span>
        </div>
    )
}

Tooltip.propTypes = {
    showTooltip: PropTypes.bool.isRequired,
    // Also add support for node
    content: PropTypes.string.isRequired,
}

export default Tooltip

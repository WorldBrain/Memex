import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

const Tooltip = ({ showTooltip, children }) => {
    return (
        <div>
            <span className={cx({ hideTooltip: !showTooltip })}>
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

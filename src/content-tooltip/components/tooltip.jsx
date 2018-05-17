import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './tooltip.css'

const cssClasses = {
    pristine: 'stateInitial',
    running: 'stateCreatingLink',
    done: 'stateCreatedLink',
    error: 'stateLinkError',
    copied: 'stateLinkCopied',
}

const Tooltip = ({ x, y, state, tooltipComponent }) => {
    return (
        <div
            className={classNames(styles.tooltip, styles[cssClasses[state]])}
            style={{ left: x, top: y }}
        >
            {tooltipComponent}
        </div>
    )
}

Tooltip.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    tooltipComponent: PropTypes.element.isRequired,
}

export default Tooltip

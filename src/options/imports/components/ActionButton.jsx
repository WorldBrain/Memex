import React, { PropTypes } from 'react'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './ButtonBar.css'

const ActionButton = ({ children, handleClick, isDisabled }) => (
    <button
        className={classNames(localStyles.actionButton, styles.button)}
        onClick={handleClick}
        disabled={isDisabled}
    >
        {children}
    </button>
)

ActionButton.propTypes = {
    // State
    isDisabled: PropTypes.bool,

    // Event handlers
    handleClick: PropTypes.func.isRequired,

    // Misc
    children: PropTypes.string.isRequired, // Button text
}

export default ActionButton


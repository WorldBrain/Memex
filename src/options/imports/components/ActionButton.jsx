import React, { PropTypes } from 'react'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './ButtonBar.css'

const getBtnClass = isHidden => classNames({
    [styles.button]: true,
    [localStyles.actionButton]: true,
    [localStyles.hidden]: isHidden,
})

const ActionButton = ({ children, handleClick, isHidden, isDisabled }) => (
    <button
        className={getBtnClass(isHidden)}
        onClick={handleClick}
        disabled={isDisabled}
    >
        {children}
    </button>
)

ActionButton.propTypes = {
    // State
    isDisabled: PropTypes.bool,
    isHidden: PropTypes.bool,

    // Event handlers
    handleClick: PropTypes.func.isRequired,

    // Misc
    children: PropTypes.string.isRequired, // Button text
}

export default ActionButton

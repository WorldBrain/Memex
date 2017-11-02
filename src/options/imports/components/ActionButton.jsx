import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './ButtonBar.css'

const getBtnClass = ({ isHidden, customClass }) =>
    classNames(
        styles.button,
        localStyles.actionButton,
        localStyles[customClass],
        { [localStyles.hidden]: isHidden },
    )

const ActionButton = ({
    children,
    handleClick,
    isDisabled,
    type = 'button',
    ...props
}) => (
    <button
        className={getBtnClass(props)}
        onClick={handleClick}
        disabled={isDisabled}
        type={type}
    >
        {children}
    </button>
)

ActionButton.propTypes = {
    // State
    isDisabled: PropTypes.bool,
    isHidden: PropTypes.bool,
    customClass: PropTypes.string,
    type: PropTypes.string,

    // Event handlers
    handleClick: PropTypes.func.isRequired,

    // Misc
    children: PropTypes.string.isRequired, // Button text
}

export default ActionButton

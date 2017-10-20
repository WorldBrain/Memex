import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './ButtonBar.css'

const getBtnClass = isHidden =>
    classNames({
        [styles.button]: true,
        [localStyles.actionButton]: true,
        [localStyles.hidden]: isHidden,
    })

const ActionButton = ({
    children,
    handleClick,
    isHidden,
    isDisabled,
    customClass,
}) => (
    <button
        className={
            getBtnClass(isHidden) +
            ' _src_options_imports_components_ButtonBar__' +
            customClass
        }
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
    customClass: PropTypes.string,

    // Event handlers
    handleClick: PropTypes.func.isRequired,

    // Misc
    children: PropTypes.string.isRequired, // Button text
}

export default ActionButton

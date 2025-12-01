import React from 'react'
import PropTypes from 'prop-types'

const ActionButton = ({
    children,
    handleClick,
    isDisabled,
    type = 'button',
}) => (
    <button onClick={handleClick} disabled={isDisabled} type={type}>
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
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        .isRequired, // Button text
}

export default ActionButton

import React from 'react'
import PropTypes from 'prop-types'

const Button = ({ icon, onClick, children }) => (
    <button className='popup-item popup-item-button' onClick={onClick}>
        <i className='material-icons'>{icon}</i>
        {children}
    </button>
)

Button.propTypes = {
    onClick: PropTypes.func,
    icon: PropTypes.string.isRequired,
    children: PropTypes.string.isRequired,
}

export default Button

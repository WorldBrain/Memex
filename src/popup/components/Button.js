import React from 'react'
import PropTypes from 'prop-types'

const Button = ({ icon, children, ...btnProps }) => (
    <button className='popup-item popup-item-button' {...btnProps}>
        <i className='material-icons'>{icon}</i>
        {children}
    </button>
)

Button.propTypes = {
    icon: PropTypes.string.isRequired,
    children: PropTypes.string.isRequired,
}

export default Button

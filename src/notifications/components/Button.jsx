import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Notification.css'

const Button = props => (
    <a
        href={props.url}
        className={localStyles.button}
        target={props.context === 'new_tab' ? '_blank' : '_self'}
    >
        {props.label}
    </a>
)

Button.propTypes = {
    url: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    context: PropTypes.string,
}

export default Button

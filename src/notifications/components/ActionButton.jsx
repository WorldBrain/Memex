import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Notification.css'

const ActionButton = props => (
    <div className={localStyles.button} onClick={props.handleClick}>
        {props.label}
    </div>
)

ActionButton.propTypes = {
    label: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
}

export default ActionButton

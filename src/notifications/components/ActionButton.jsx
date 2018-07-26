import React from 'react'
import PropTypes from 'prop-types'

import styles from './Notification.css'

const ActionButton = props => (
    <button className={styles.actionButton} onClick={props.handleClick}>
        {props.children}
    </button>
)

ActionButton.propTypes = {
    children: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
}

export default ActionButton

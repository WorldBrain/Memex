import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'
import styles from './tooltip-first-close.css'

export default function TooltipFirstCloseNotification({ onCloseRequested }) {
    return (
        <NotificationLayout
            title={'Re-enable any time'}
            icon={styles.icon}
            onCloseRequested={onCloseRequested}
        >
            Via the little icon in the menu
        </NotificationLayout>
    )
}

TooltipFirstCloseNotification.propTypes = {
    onCloseRequested: PropTypes.func.isRequired,
}

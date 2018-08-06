import React from 'react'
import PropTypes from 'prop-types'
import styles from './Notification.css'

const Notification = props => {
    const alertIconURL = browser.extension.getURL('img/alert.svg')
    const checkURL = browser.extension.getURL('img/tick_green.svg')

    return (
        <div className={styles.mainContainer}>
            <div className={styles.alertIcon}>
                <img src={alertIconURL} />
            </div>
            <div className={styles.messageTitle}>
                <div className={styles.title}>{props.title}</div>
                <div className={styles.message}>{props.message}</div>
            </div>
            {props.button}
            <div
                className={styles.tick}
                onClick={props.handleTick}
                title="Mark as read"
            >
                <img src={checkURL} />
            </div>
        </div>
    )
}

Notification.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    handleTick: PropTypes.func.isRequired,
    button: PropTypes.node,
}

export default Notification

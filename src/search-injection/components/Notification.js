import React from 'react'
import PropTypes from 'prop-types'
import styles from './Notification.css'

const Notification = props => {

    return (
        <div className={styles.mainContainer}>
            <div className={styles.messageTitle}>
                <div className={styles.title}>{props.title}</div>
                <div className={styles.message}>{props.message}</div>
            </div>
            <div className={styles.button}>{props.button}</div>
              <div
                className={styles.tick}
                onClick={props.handleTick}
                title="Mark as read"
            >
            Mark as Read
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

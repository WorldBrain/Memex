import React from 'react'
import PropTypes from 'prop-types'

import styles from './CrowdfundingBox.css'

const CrowdfundingBox = props => (
    <div className={styles.container}>
        <p className={styles.header}>Sharing not available yet</p>
        <p className={styles.boldText}>You can make it possible</p>
        <p className={styles.boldText}>Back it with 10€</p>
        <p className={styles.text}>
            and receive 30€ worth of Memex credits once it launches.
        </p>
        <a className={styles.learnMore}>Learn More</a>
        <div onClick={props.onClose} className={styles.closeDiv}>
            Close Notification
        </div>
    </div>
)

CrowdfundingBox.propTypes = {
    onClose: PropTypes.func.isRequired,
}

export default CrowdfundingBox

import React from 'react'
import PropTypes from 'prop-types'

import styles from './NotificationList.css'

const StatusHeading = ({ children }) => (
    <div className={styles.heading}>{children}</div>
)

StatusHeading.propTypes = {
    children: PropTypes.string.isRequired,
}

export default StatusHeading

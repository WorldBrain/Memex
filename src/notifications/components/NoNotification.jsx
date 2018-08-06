import React from 'react'
import PropTypes from 'prop-types'

import styles from './NoNotification.css'

const NoNotification = ({ title, children }) => (
    <div className={styles.mainContainer}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{children}</div>
    </div>
)

NoNotification.propTypes = {
    title: PropTypes.string,
    children: PropTypes.string.isRequired,
}

export default NoNotification

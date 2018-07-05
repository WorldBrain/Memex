import React from 'react'
import PropTypes from 'prop-types'

import styles from './NotificationList.css'

const NotificationList = ({ children }) => (
    <ul className={styles.root}>{children}</ul>
)

NotificationList.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default NotificationList

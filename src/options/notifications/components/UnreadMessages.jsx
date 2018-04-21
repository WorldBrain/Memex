import React from 'react'
import PropTypes from 'prop-types'

import styles from './UnreadMessages.css'

const UnreadMessages = ({ children }) => (
    <div className={styles.tableContainer}>
        <table className={styles.table}>
            <tbody>{children}</tbody>
        </table>
    </div>
)

UnreadMessages.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default UnreadMessages

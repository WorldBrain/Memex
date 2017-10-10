import React from 'react'
import PropTypes from 'prop-types'

import styles from './Overview.css'

const ResultsMessage = ({ children }) => (
    <p className={styles.noResultMessage}>{children}</p>
)

ResultsMessage.propTypes = {
    children: PropTypes.string.isRequired,
}

export default ResultsMessage

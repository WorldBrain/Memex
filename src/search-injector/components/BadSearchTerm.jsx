import React from 'react'
import PropTypes from 'prop-types'

import styles from './Result.css'
const BadSearchTerm = ({ children }) => (
    <div className={styles.resultItems}>
        <h1>{children}</h1>
        <p>¯\_(ツ)_/¯</p>
    </div>
)

BadSearchTerm.propTypes = {
    children: PropTypes.string.isRequired,
}

export default BadSearchTerm

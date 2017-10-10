import React from 'react'
import PropTypes from 'prop-types'

import styles from './ResultList.css'

const ResultList = ({ children }) => <ul className={styles.root}>{children}</ul>

ResultList.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default ResultList

import React from 'react'
import PropTypes from 'prop-types'

import styles from './ClearFilter.css'

const ClearFilter = ({ resetFilters }) => (
    <a onClick={resetFilters} className={styles.showAll}>
        clear all filters
    </a>
)

ClearFilter.propTypes = {
    resetFilters: PropTypes.func,
}

export default ClearFilter

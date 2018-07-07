import React from 'react'
import PropTypes from 'prop-types'

import styles from './FilterBar.css'

const FilterBar = ({ filter, onBarClick }) => (
    <div onClick={onBarClick} className={styles.collection}>
        <span className={styles.myCollection}> {`${filter}s`} </span>
        <span className={styles.plus}> + </span>
    </div>
)

FilterBar.propTypes = {
    filter: PropTypes.string.isRequired,
    onBarClick: PropTypes.func,
}

export default FilterBar

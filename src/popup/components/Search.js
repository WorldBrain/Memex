import React from 'react'
import PropTypes from 'prop-types'

import styles from './Popup.css'

const Search = ({ onSearchEnter, onSearchChange, searchValue }) => (
    <form className={styles.searchContainer}>
        <input
            className={styles.search}
            name="query"
            placeholder="Search your memory"
            onKeyDown={onSearchEnter}
            onChange={onSearchChange}
            value={searchValue}
        />
        <i className="material-icons">search</i>
    </form>
)

Search.propTypes = {
    onSearchEnter: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    searchValue: PropTypes.string.isRequired,
}

export default Search

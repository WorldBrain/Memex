import React from 'react'
import PropTypes from 'prop-types'

import styles from './settings.css'

const SearchInjection = ({ children }) => {
    return (
        <div className={styles.container}>
            <h1 className={styles.header}>
                Show Memex Results in Search Engines
            </h1>
            {children}
        </div>
    )
}

SearchInjection.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default SearchInjection

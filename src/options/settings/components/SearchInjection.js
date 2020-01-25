import React from 'react'
import PropTypes from 'prop-types'

import styles from './settings.css'

const SearchInjection = ({ children }) => {
    return (
        <div className={styles.section}>
            <div className={styles.sectionTitle}>
                Show Memex Results in Search Engines
            </div>
            <div className={styles.infoText}>
                Display Memex search results alongside your web searches.
            </div>
            {children}
        </div>
    )
}

SearchInjection.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default SearchInjection

import React from 'react'
import PropTypes from 'prop-types'

import styles from './SearchInjection.css'

const SearchInjection = ({ children }) => {
    return (
        <div>
            <p className={styles.settingsHeader}>
                Show Memex Results in Search Engines
            </p>
            {children}
            <p>
                Want others?{' '}
                <a
                    target="_new"
                    href="https://github.com/WorldBrain/Memex/blob/master/CONTRIBUTING.md"
                >
                    Help integrating them
                </a>.
            </p>
        </div>
    )
}

SearchInjection.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
}

export default SearchInjection

import React from 'react'
import PropTypes from 'prop-types'

import styles from './Settings.css'

const SearchInjection = ({ children }) => {
    return (
        <div className={styles.container}>
            <h1 className={styles.header}>
                Show Memex Results in Search Engines
            </h1>
            {children}
            <p className={styles.subText}>
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

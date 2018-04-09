import React from 'react'
import PropTypes from 'prop-types'

import Checkbox from './Checkbox'
import styles from './SearchInjection.css'

const SearchInjection = ({ injectionPreference, toggleGoogle, toggleDDG }) => {
    return (
        <div>
            <p className={styles.settingsHeader}>
                Show Memex Results in Search Engines
            </p>
            <Checkbox
                isChecked={injectionPreference.google}
                handleChange={toggleGoogle}
            >
                Google
            </Checkbox>
            <Checkbox
                isChecked={injectionPreference.duckduckgo}
                handleChange={toggleDDG}
            >
                DuckDuckGo
            </Checkbox>
            <p>
                Want others?{' '}
                <a
                    target="_new"
                    href="https://github.com/WorldBrain/Memex/blob/master/docs/Contributing-Guide.md"
                >
                    Help integrating them
                </a>.
            </p>
        </div>
    )
}

SearchInjection.propTypes = {
    injectionPreference: PropTypes.object.isRequired,
    toggleGoogle: PropTypes.func.isRequired,
    toggleDDG: PropTypes.func.isRequired,
}

export default SearchInjection

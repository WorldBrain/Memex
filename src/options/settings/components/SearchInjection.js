import React from 'react'
import PropTypes from 'prop-types'

import Checkbox from './Checkbox'
import styles from './SearchInjection.css'

const SearchInjection = ({ injectionPreference, toggleInjection }) => {
    return (
        <div>
            <p className={styles.settingsHeader}>
                Show Memex Results in Search Engines
            </p>
            <Checkbox
                name="google"
                id="google-checkbox"
                isChecked={injectionPreference.google}
                handleChange={toggleInjection}
            >
                Google
            </Checkbox>
            <Checkbox
                name="duckduckgo"
                id="ddg-checkbox"
                isChecked={injectionPreference.duckduckgo}
                handleChange={toggleInjection}
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
    toggleInjection: PropTypes.func.isRequired,
}

export default SearchInjection

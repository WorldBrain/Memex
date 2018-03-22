import React from 'react'
import PropTypes from 'prop-types'

import Checkbox from './Checkbox'
import styles from './SearchInjection.css'

const SearchInjection = ({
    isInjectionEnabled,
    toggleInjection,
}) => {
    return (
        <div>
            <p className={styles.settingsHeader}>
                Show Memex Results in Search Engines
            </p>
            <Checkbox
                name="google"
                id="google-checkbox"
                isChecked={isInjectionEnabled}
                handleChange={toggleInjection}
            >
                Google
            </Checkbox>
        </div>
    )
}

SearchInjection.propTypes = {
    isInjectionEnabled: PropTypes.bool.isRequired,
    toggleInjection: PropTypes.func.isRequired,
}

export default SearchInjection

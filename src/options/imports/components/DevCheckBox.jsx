import React from 'react'
import PropTypes from 'prop-types'

import styles from './DevOptions.css'

const DevCheckBox = ({ devMode, toggleDevMode }) => (
    <div className={styles.devModeToggle}>
        <input
            type="checkbox"
            id="devModeCheckbox"
            onChange={toggleDevMode}
            checked={devMode}
        />
        <label htmlFor="devModeCheckbox">Enable developer mode</label>
    </div>
)

DevCheckBox.propTypes = {
    devMode: PropTypes.bool.isRequired,
    toggleDevMode: PropTypes.func.isRequired,
}

export default DevCheckBox

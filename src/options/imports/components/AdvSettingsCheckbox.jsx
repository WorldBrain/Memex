import React from 'react'
import PropTypes from 'prop-types'

import styles from './AdvSettings.css'

const AdvSettingsCheckbox = ({ advMode, toggleAdvMode }) => (
    <div className={styles.advModeToggle}>
        <input
            type="checkbox"
            id="advModeCheckbox"
            onChange={toggleAdvMode}
            checked={advMode}
            className={styles.checkbox}
        />
        <label htmlFor="advModeCheckbox">Advanced Settings</label>
    </div>
)

AdvSettingsCheckbox.propTypes = {
    advMode: PropTypes.bool.isRequired,
    toggleAdvMode: PropTypes.func.isRequired,
}

export default AdvSettingsCheckbox

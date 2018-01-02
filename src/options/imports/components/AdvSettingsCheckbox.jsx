import React from 'react'
import PropTypes from 'prop-types'

import styles from './AdvSettings.css'
import importStyles from './Import.css'

const AdvSettingsCheckbox = ({ advMode, toggleAdvMode }) => (
    <div className={styles.advModeToggle}>
        <input
            type="checkbox"
            id="advModeCheckbox"
            onChange={toggleAdvMode}
            checked={advMode}
            className={importStyles.checkbox}
        />
        <label htmlFor="advModeCheckbox">Advanced Settings</label>
    </div>
)

AdvSettingsCheckbox.propTypes = {
    advMode: PropTypes.bool.isRequired,
    toggleAdvMode: PropTypes.func.isRequired,
}

export default AdvSettingsCheckbox

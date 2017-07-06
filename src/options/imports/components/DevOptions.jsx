import React from 'react'
import PropTypes from 'prop-types'

import TestDataUpload from './TestDataUpload'

import styles from './DevOptions.css'

const DevOptions = ({ devMode, toggleDevMode, ...uploadProps }) => (
    <section className={styles.container}>
        <div className={styles.devModeToggle}>
            <input type='checkbox' id='devModeCheckbox' onChange={toggleDevMode} checked={devMode} />
            <label htmlFor='devModeCheckbox'>Enable dev mode</label>
        </div>

        {devMode && <TestDataUpload {...uploadProps} />}
    </section>
)

DevOptions.propTypes = {
    devMode: PropTypes.bool.isRequired,
    toggleDevMode: PropTypes.func.isRequired,
}

export default DevOptions

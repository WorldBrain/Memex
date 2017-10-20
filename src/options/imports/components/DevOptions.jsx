import React from 'react'
import PropTypes from 'prop-types'

import TestDataUpload from './TestDataUpload'

import styles from './DevOptions.css'

const DevOptions = ({ devMode, toggleDevMode, ...uploadProps }) => (
    <section className={styles.container}>
        {devMode && (
            <div className={styles.devFunctionality}>
                <p className={styles.warning}>
                    Note that the options in here are for advanced use only, and
                    could lead to unexpected behaviour.
                </p>
                <TestDataUpload {...uploadProps} />
            </div>
        )}
    </section>
)

DevOptions.propTypes = {
    devMode: PropTypes.bool.isRequired,
    toggleDevMode: PropTypes.func.isRequired,
}

export default DevOptions

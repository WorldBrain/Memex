import React from 'react'
import PropTypes from 'prop-types'

import TestDataUpload from './TestDataUpload'

import styles from './AdvSettings.css'

const AdvSettings = ({ advMode, toggleAdvMode, ...uploadProps }) => (
    <section className={styles.container}>
        {advMode && (
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

AdvSettings.propTypes = {
    advMode: PropTypes.bool.isRequired,
    toggleAdvMode: PropTypes.func.isRequired,
}

export default AdvSettings

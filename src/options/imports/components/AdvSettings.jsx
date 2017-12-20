import React from 'react'
import PropTypes from 'prop-types'

import TestDataUpload from './TestDataUpload'
import Concurrency from './Concurrency'
import PrevFailedCheckbox from './PrevFailedCheckbox'

import styles from './AdvSettings.css'

const AdvSettings = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    <section className={styles.container}>
        {props.advMode && (
            <div className={styles.advFunctionality}>
                <p className={styles.warning}>
                    Note that the options in here are for advanced use only, and
                    could lead to unexpected behaviour.
                </p>
                <ul className={styles.settingsList}>
                    <li className={styles.settingsListItem}>
                        <TestDataUpload {...props} />
                    </li>
                    <li className={styles.settingsListItem}>
                        <Concurrency {...props} />
                    </li>
                    <li className={styles.settingsListItem}>
                        <PrevFailedCheckbox
                            checked={prevFailedValue}
                            onChange={onPrevFailedToggle}
                        />
                    </li>
                </ul>
            </div>
        )}
    </section>
)

AdvSettings.propTypes = {
    advMode: PropTypes.bool.isRequired,
    onPrevFailedToggle: PropTypes.func.isRequired,
    prevFailedValue: PropTypes.bool.isRequired,
}

export default AdvSettings

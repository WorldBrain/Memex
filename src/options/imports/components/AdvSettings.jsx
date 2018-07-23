import React from 'react'
import PropTypes from 'prop-types'

import Concurrency from './Concurrency'
import PrevFailedCheckbox from './PrevFailedCheckbox'

import styles from './AdvSettings.css'

const AdvSettings = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    <section className={styles.container}>
        {props.advMode && (
            <div className={styles.advFunctionality}>
                <ul className={styles.settingsList}>
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

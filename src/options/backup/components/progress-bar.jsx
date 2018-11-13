import React from 'react'
import PropTypes from 'prop-types'
import styles from './progress-bar.css'

export function BackupProgressBar(props) {
    const percentageNumber = Math.floor(props.value * 100)
    const clampedPercentage = Math.max(10, percentageNumber)
    return (
        <div className={styles.outerProgressBar}>
            <div
                className={styles.innerProgressBar}
                style={{ width: `${Math.max(clampedPercentage)}%` }}
            >
                <div
                    className={styles.progressPercentage}
                >{`${percentageNumber}%`}</div>
            </div>
        </div>
    )
}

BackupProgressBar.propTypes = {
    value: PropTypes.number, // float from 0 to 1
}

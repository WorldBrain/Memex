import React, { PropTypes } from 'react'
import classNames from 'classnames'

import { LoadingIndicator } from 'src/common-ui/components'
import styles from './ButtonBar.css'

const ButtonBar = ({ isRunning, helpText, children }) => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            {isRunning && <LoadingIndicator />}
        </div>
        <div className={styles.actionContainer}>
            <div className={styles.actionBar}>
                {children}
            </div>
            <div className={styles.helpText}>
                {helpText}
            </div>
        </div>
    </div>
)

ButtonBar.propTypes = {
    isRunning: PropTypes.bool.isRequired,
    helpText: PropTypes.string.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default ButtonBar

import React, { PropTypes } from 'react'
import classNames from 'classnames'

import { LoadingIndicator } from 'src/common-ui/components'
import styles from './ButtonBar.css'

const getTextClass = isStopped => classNames({
    [styles.helpText]: true,
    [styles.running]: !isStopped,
})

const ButtonBar = ({ isLoading, isStopped, showCancelText, children }) => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            {isLoading && <LoadingIndicator />}
        </div>
        <div className={styles.actionContainer}>
            <div className={styles.actionBar}>
                {children}
            </div>
            {showCancelText
                ? <div className={styles.helpText}>Press cancel again to confirm</div>
                : <div className={getTextClass(isStopped)}>
                    Downloading may slow down your browsing experience.<br /> You can pause and resume anytime
                </div>
            }
        </div>
    </div>
)

ButtonBar.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    showCancelText: PropTypes.bool.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default ButtonBar

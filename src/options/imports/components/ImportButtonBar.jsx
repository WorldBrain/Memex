import React, { PropTypes } from 'react'

import { LoadingIndicator } from 'src/common-ui/components'
import styles from './ImportButtonBar.css'

const ImportButtonBar = ({ isLoading, isStopped, children }) => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            {isLoading && <LoadingIndicator />}
        </div>
        <div className={styles.actionContainer}>
            <div className={styles.actionBar}>
                {children}
            </div>
            {isStopped
                && <div className={styles.helpText}>
                    Downloading may slow down your browsing experience.<br /> You can pause and resume anytime
                </div>
            }
        </div>
    </div>
)

ImportButtonBar.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default ImportButtonBar

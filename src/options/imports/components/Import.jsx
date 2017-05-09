import React, { PropTypes } from 'react'

import { LoadingIndicator } from 'src/common-ui/components'
import styles from '../../options.css'
import localStyles from './Import.css'

const Import = ({ isInit, children }) => (
    <div>
        <h1 className={styles.routeTitle}>Analyse History & Bookmarks</h1>
        <div className={localStyles.mainContainer}>
            <div className={localStyles.importTableContainer}>
                {children}
            </div>
            {isInit
                && <div className={localStyles.initBlocker}>
                    <LoadingIndicator />
                </div>
            }
        </div>
    </div>
)

Import.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    isInit: PropTypes.bool.isRequired,
}

export default Import

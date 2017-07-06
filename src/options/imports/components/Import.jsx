import React from 'react'
import PropTypes from 'prop-types'

import DevOptions from '../DevOptionsContainer'
import { LoadingIndicator } from 'src/common-ui/components'
import styles from '../../options.css'
import localStyles from './Import.css'

const Import = ({ isLoading, loadingMsg, children }) => (
    <div>
        <h1 className={styles.routeTitle}>Analyse History & Bookmarks</h1>
        <div className={localStyles.mainContainer}>
            <div className={localStyles.importTableContainer}>
                {children}
            </div>
            {isLoading
            && <div className={localStyles.loadingBlocker}>
                <p className={localStyles.loadingMsg}>{loadingMsg}</p>
                <LoadingIndicator />
            </div>
            }
        </div>
        <DevOptions />
    </div>
)

Import.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    isLoading: PropTypes.bool.isRequired,
    loadingMsg: PropTypes.string,
}

export default Import

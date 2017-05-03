import React, { PropTypes } from 'react'

import styles from '../../options.css'
import localStyles from './Import.css'

const Import = ({ children }) => (
    <div>
        <h1 className={styles.routeTitle}>Analyse History & Bookmarks</h1>
        <div className={localStyles.importTableContainer}>
            {children}
        </div>
    </div>
)

Import.propTypes = { children: PropTypes.arrayOf(PropTypes.node).isRequired }

export default Import

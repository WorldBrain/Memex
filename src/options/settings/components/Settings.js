import React from 'react'

import SearchInjection from './SearchInjectionContainer'
import IndexingPrefs from './IndexingPrefsContainer'
import Tooltip from './Tooltip'
import Ribbon from './Ribbon'
import KeyboardShortcutsContainer from './keyboard-shortcuts-container'
import styles from './settings.css'

export default () => (
    <React.Fragment>
        <div className={styles.block}>
        <KeyboardShortcutsContainer />
        </div>
    	<div className={styles.block}>
        <SearchInjection />
        </div>
        <div className={styles.block}>
        <Tooltip />
        </div>
        <div className={styles.block}>
        <Ribbon />
        </div>
        <div className={styles.block}>
        <IndexingPrefs />
        </div>
    </React.Fragment>
)

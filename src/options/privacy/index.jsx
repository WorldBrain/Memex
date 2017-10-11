import React from 'react'

import styles from '../options.css'
import localStyles from './styles.css'

const PrivacyContainer = () => (
    <div className={localStyles.privacy}>
        <h1 className={styles.routeTitle}>Settings &gt; Privacy</h1>

        <span className={localStyles.title}>
            {' '}
            &gt; Your privacy is paramount to us. Your data is safe and
            anonymous.
        </span>

        <div className={localStyles.content}>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
        </div>
    </div>
)

export default PrivacyContainer

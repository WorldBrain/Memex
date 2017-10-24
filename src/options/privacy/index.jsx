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
            We will never retain or sell your data. In fact it is impossible for
            us to do so. All of your data is kept on your local machine.
        </div>
    </div>
)

export default PrivacyContainer

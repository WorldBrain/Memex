import React from 'react'

import Blacklist from '../../blacklist'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <section>
            <div className={styles.title}>
                {' '}
                Prevent URLs and domains from being indexed
            </div>

            <Blacklist />
        </section>
    </div>
)

export default SettingsContainer

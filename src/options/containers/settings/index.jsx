import React from 'react'

import Blacklist from '../../blacklist'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <section className={styles.section}>
            <div className={styles.title}>
                {' '}
                Prevent specific URLs and domains from being indexed when
                visiting them
            </div>

            <Blacklist />
        </section>
    </div>
)

export default SettingsContainer

import React from 'react'

import Blacklist from '../../blacklist'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <h1 className={routeTitle}>Settings</h1>

        <section className={styles.section}>
            <h2 className={sectionTitle}>Ignored Sites</h2>

            <Blacklist />
        </section>
    </div>
)

export default SettingsContainer

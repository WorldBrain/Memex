import React from 'react'

import Blacklist from '../../blacklist'
import Search from '../../search'
import Preferences from '../../preferences'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <h1 className={routeTitle}>Settings</h1>

        <section className={styles.section}>
            <h2 className={sectionTitle}>Ignored Sites</h2>

            <Blacklist />
        </section>
        <section className={styles.section}>
            <h2 className={sectionTitle}>Miscellaneous Preferences</h2>

            <Preferences />
        </section>
        <section className={styles.section}>
            <h2 className={sectionTitle}>search-index dev</h2>

            <Search />
        </section>
    </div>
)

export default SettingsContainer

import React from 'react'

import Blacklist from '../../blacklist'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <h1 className={routeTitle}>Settings &gt; Blacklist</h1>

        <section className={styles.section}>
            <div className={sectionTitle}> &gt; Ignore Specific domains from your memory when visiting them</div>

            <Blacklist />
        </section>
        {/* <section className={styles.section}>
                   <h2 className={sectionTitle}>Miscellaneous Preferences</h2>

                   <Preferences />
               </section> */}
    </div>
)

export default SettingsContainer

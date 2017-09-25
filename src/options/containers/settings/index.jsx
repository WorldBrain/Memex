import React from 'react'

import Blacklist from '../../blacklist'
import Preferences from '../../preferences'
import { routeTitle, sectionTitle } from '../../base.css'
import styles from './style.css'

const SettingsContainer = () => (
    <div>
        <h1 className={routeTitle}>Settings > Blacklist</h1>

        <section className={styles.section}>
            <div className={sectionTitle}>> Ignore Specific domains from your memory when visiting them</div>

            <Blacklist />
        </section>
       {/* <section className={styles.section}>
                   <h2 className={sectionTitle}>Miscellaneous Preferences</h2>
       
                   <Preferences />
               </section>*/}
    </div>
)

export default SettingsContainer

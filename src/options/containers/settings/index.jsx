import React from 'react'

import Blacklist from '../../blacklist'
import { routeTitle, sectionTitle } from '../../base.css'
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
        {/* <section className={styles.section}>
                   <h2 className={sectionTitle}>Miscellaneous Preferences</h2>

                   <Preferences />
               </section> */}
    </div>
)

export default SettingsContainer

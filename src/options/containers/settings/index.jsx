import React from 'react'

import Blacklist from '../../blacklist'
import settingsStyle from 'src/options/settings/components/settings.css'

const SettingsContainer = () => (
    <div>
        <section className={settingsStyle.section}>
            <div className={settingsStyle.sectionTitle}>
                {' '}
                Prevent URLs and domains from being indexed
            </div>

            <Blacklist />
        </section>
    </div>
)

export default SettingsContainer

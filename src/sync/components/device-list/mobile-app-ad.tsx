import React from 'react'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('./mobile-app-ad.css')

export interface Props {}

const MobileAppAd: React.StatelessComponent<Props> = props => (
    <div className={styles.mobileSection}>
        <div className={styles.contentSection}>
            <div className={settingsStyle.sectionTitle}>Download Memex GO</div>
            <div className={settingsStyle.infoText}>
                Our mobile to save and organise websites on the Go
            </div>
            <div>
                <img className={styles.downloadImg} src={'img/appStore.png'} />
                <img
                    className={styles.downloadImg}
                    src={'img/googlePlay.png'}
                />
            </div>
        </div>
        <img src={'img/mobilehalf.png'} className={styles.mobileImg} />
    </div>
)

export default MobileAppAd

import React from 'react'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('./mobile-app-ad.css')

export interface Props {}

const MobileAppAd: React.StatelessComponent<Props> = props => (
    <div className={styles.mobileSection}>
        <div className={styles.contentSection}>
            <div className={settingsStyle.sectionTitle}>Download Memex GO</div>
            <div className={settingsStyle.infoText}>
                Our mobile app to save and organise websites on the Go
            </div>
            <div className={settingsStyle.storeSection}>
                <img 
                    onClick={()=> {window.open('https://apps.apple.com/app/id1471860331')}}
                    className={styles.downloadImg} 
                    src={'img/appStore.png'} />
                <img
                    onClick={()=> {window.open('https://play.google.com/store/apps/details?id=io.worldbrain')}}
                    className={styles.downloadImg}
                    src={'img/googlePlay.png'}
                />
            </div>
        </div>
        <div className={styles.mobileContainer}>
            <img
                src={'img/mobileHalf.svg'}
                className={styles.mobileImg}
            />
        </div>
    </div>
)

export default MobileAppAd

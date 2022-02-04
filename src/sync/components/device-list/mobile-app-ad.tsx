import React from 'react'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('./mobile-app-ad.css')
import styled from 'styled-components'

export interface Props {}

const MobileAppAd: React.StatelessComponent<Props> = (props) => (
    <div className={styles.mobileSection}>
        <div className={styles.contentSection}>
            <SectionTitle>Download Memex GO</SectionTitle>
            <InfoText>
                Our mobile app to annotate and organise websites on the Go
            </InfoText>
            <div className={settingsStyle.storeSection}>
                <img
                    onClick={() => {
                        window.open('https://apps.apple.com/app/id1471860331')
                    }}
                    className={styles.downloadImg}
                    src={'img/appStore.png'}
                />
                <img
                    onClick={() => {
                        window.open(
                            'https://play.google.com/store/apps/details?id=io.worldbrain',
                        )
                    }}
                    className={styles.downloadImg}
                    src={'img/googlePlay.png'}
                />
            </div>
        </div>
        <div className={styles.mobileContainer}>
            <img src={'img/mobileHalf.svg'} className={styles.mobileImg} />
        </div>
    </div>
)

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

export default MobileAppAd

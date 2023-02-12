import React from 'react'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('./mobile-app-ad.css')
import styled from 'styled-components'

export interface Props {}

const MobileAppAd: React.StatelessComponent<Props> = (props) => (
    <StoreSection>
        <StoreImage
            onClick={() => {
                window.open('https://apps.apple.com/app/id1471860331')
            }}
            className={styles.downloadImg}
            src={'img/appStore.png'}
        />
        <StoreImage
            onClick={() => {
                window.open(
                    'https://play.google.com/store/apps/details?id=io.worldbrain',
                )
            }}
            className={styles.downloadImg}
            src={'img/googlePlay.png'}
        />
    </StoreSection>
)

const StoreSection = styled.div`
    display: flex;
    align-items: center;
`

const StoreImage = styled.img`
    height: 30px;
    width: auto;
`

export default MobileAppAd

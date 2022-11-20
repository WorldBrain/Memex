import React from 'react'

const settingsStyle = require('src/options/settings/components/settings.css')
const styles = require('./mobile-app-ad.css')
import styled from 'styled-components'

export interface Props {}

const MobileAppAd: React.StatelessComponent<Props> = (props) => (
    <MobileSection>
        <ContentSection>
            <SectionTitle>Download Memex GO</SectionTitle>
            <InfoText>
                Our mobile app to annotate and organise websites on the Go
            </InfoText>
        </ContentSection>
        <StoreSection>
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
        </StoreSection>
        {/* <div className={styles.mobileContainer}>
            <img src={'img/mobileHalf.svg'} className={styles.mobileImg} />
        </div> */}
    </MobileSection>
)

const StoreSection = styled.div`
    display: flex;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 14px;
    margin-bottom: 10px;
    font-weight: 300;
`

const MobileSection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`
const ContentSection = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`

export default MobileAppAd

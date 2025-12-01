import React from 'react'
import styled from 'styled-components'

export interface Props {}

const MobileAppAd: React.FC<Props> = (props) => (
    <StoreSection>
        <StoreImage
            onClick={() => {
                window.open('https://apps.apple.com/app/id1471860331')
            }}
            src={'img/appStore.png'}
        />
        <StoreImage
            onClick={() => {
                window.open(
                    'https://play.google.com/store/apps/details?id=io.worldbrain',
                )
            }}
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

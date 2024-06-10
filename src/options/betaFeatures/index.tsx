import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import React from 'react'
import styled from 'styled-components'

export class BetaFeatures extends React.Component {
    render() {
        return (
            <SettingSection
                icon={'stars'}
                title={'Beta Features'}
                description={
                    'These features are still in development and may not be fully stable. Use at your own risk.'
                }
            >
                {BetaFeaturesData.map((feature) => (
                    <Row>
                        <LeftSide>
                            <Title>{feature.title}</Title>
                            <Description>{feature.description}</Description>
                        </LeftSide>
                        <RightSide>
                            <PrimaryAction
                                label="More Info"
                                onClick={() => {}}
                                type="tertiary"
                                size={'medium'}
                            />
                            <PrimaryAction
                                label="Activate"
                                onClick={() => {}}
                                type="primary"
                                size={'medium'}
                            />
                        </RightSide>
                    </Row>
                ))}
            </SettingSection>
        )
    }
}

const BetaFeaturesData = [
    {
        id: 'imageOverlay',
        title: 'Image Hover Buttons',
        description:
            'Display an overlay on every image to either save it or analyze it with AI.',
        moreInfo:
            'https://links.memex.garden/assets/beta-features/image-hover-buttons',
    },
]

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    grid-gap: 20px;
    margin-bottom: 30px;
`

const LeftSide = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    grid-gap: 10px;
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 18px;
    font-weight: 600;
`

const Description = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
`

const RightSide = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
`

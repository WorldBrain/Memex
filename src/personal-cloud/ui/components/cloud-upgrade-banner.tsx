import * as React from 'react'
import styled from 'styled-components'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const Container = styled.div<StyleProps>`
    display: flex;
    padding: 15px 15px;
    justify-content: space-between;
    align-items: center;
    background: #ffa3a3;
    border-radius: 3px;
    margin-bottom: 30px;
    width: ${(props) => props.width ?? '760px'};
    flex-direction: ${(props) => props.direction ?? 'row'};
    font-family: ${(props) => props.theme.fonts.primary};
`
const ContentBox = styled.div<StyleProps>`
    display: flex;
    flex-direction: column;
    padding-bottom: ${(props) => (props.direction === 'column' ? '15px' : '0')};
    text-align: ${(props) =>
        props.direction === 'column' ? 'center' : 'unset'};
`

const Title = styled.div<StyleProps>`
    font-weight: bold;
    font-size: 14px;
    padding-bottom: ${(props) => (props.direction === 'column' ? '5px' : '0')};
`

const Description = styled.div`
    font-size: 12px;
`

const ButtonBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-right: -5px;
`

export interface StyleProps {
    width?: string
    direction?: 'row' | 'column'
}

export interface Props extends StyleProps {
    onGetStartedClick: React.MouseEventHandler
}

const CloudUpgradeBanner = ({ onGetStartedClick, ...props }: Props) => (
    <Container {...props}>
        <ContentBox {...props}>
            <Title {...props}>
                Memex now supports Multi-Device Sync & has a new pricing model
            </Title>
            <Description>
                Sync between an unlimited amount of devices for free
            </Description>
        </ContentBox>
        <ButtonBox>
            <PrimaryAction label="Get Started" onClick={onGetStartedClick} />
        </ButtonBox>
    </Container>
)

export default CloudUpgradeBanner

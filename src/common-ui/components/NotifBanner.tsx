import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { theme } from './design-library/theme'
import browser from 'webextension-polyfill'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

const MemexLogo = browser.runtime.getURL('img/memexLogo.svg')
export interface ThemeProps {
    variant: MemexThemeVariant
    width?: string
    position?: string
    iconSize?: string
}

export interface Props {
    mainText: string
    mainBtnText: string
    theme?: ThemeProps
    onMainBtnClick: React.MouseEventHandler
    onCloseBtnClick: React.MouseEventHandler
    location: string
}

export class NotifBanner extends React.PureComponent<Props> {
    render() {
        const { theme: themeProps } = this.props
        themeProps.width = themeProps.width ?? '100%'
        themeProps.iconSize = '24px'

        return (
            <ThemeProvider
                theme={{
                    ...theme({ variant: this.props.theme.variant }),
                    ...themeProps,
                }}
            >
                <Banner location={this.props.location}>
                    <MainContent location={this.props.location}>
                        <Icon
                            filePath={MemexLogo}
                            heightAndWidth="30px"
                            hoverOff
                            color="prime1"
                        />
                        <MainText>{this.props.mainText}</MainText>
                        <ButtonBox location={this.props.location}>
                            <PrimaryAction
                                icon="longArrowRight"
                                onClick={this.props.onMainBtnClick}
                                label={'See changes'}
                                type={'forth'}
                                size={'medium'}
                            />
                            <Icon
                                icon="removeX"
                                heightAndWidth="22px"
                                onClick={this.props.onCloseBtnClick}
                            />
                        </ButtonBox>
                    </MainContent>
                </Banner>
            </ThemeProvider>
        )
    }
}

const ButtonBox = styled.div<{
    location: string
}>`
    display: flex;
    align-items: center;
    grid-gap: 10px;

    ${(props) => props.location === 'sidebar' && css``}
`

const Banner = styled.div<{
    location: string
}>`
    display: flex;
    flex-direction: row;
    background: ${(props) => props.theme.colors.black}70;
    height: 60px;
    width: fit-content;
    position: ${({ theme }) => theme.position};
    padding: 0 20px;
    bottom: 0px;
    right: 0px;
    z-index: 2147483647;
    justify-content: center;
    align-items: center;
    border: 1px solid ${(props) => props.theme.colors.prime1};
    margin: 0 10px 10px 10px;
    border-radius: 8px;
    backdrop-filter: blur(4px);
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.6);

    animation: slide-up ease-out;
    animation-duration: 0.2s;

    ${(props) =>
        props.location === 'sidebar' &&
        css`
            grid-gap: 10px;
            margin: 0 6px 10px -10px;
        `}

    ${(props) =>
        props.location === 'search' &&
        css`
            animation: slide-down ease-out;
            animation-duration: 0.1s;
            grid-gap: 10px;
            margin: 10px 10px 10px 10px;
            width: fill-available;
        `}
    @keyframes slide-up {
        0% {
            bottom: -100px;
            opacity: 0%;
        }
        100% {
            bottom: 0px;
            opacity: 100%;
        }
    }

    @keyframes slide-down {
        0% {
            margin-top: -60px;
            opacity: 0%;
        }
        100% {
            margin-top: 0px;
            opacity: 100%;
        }
    }
`

const MainContent = styled.div<{
    location: string
}>`
    max-width: 770px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 15px;
`
const MainText = styled.span`
    font-size: 16px;
    font-weight: bold;
    margin-right: 20px;
    color: ${(props) => props.theme.colors.white};
    white-space: nowrap;
`

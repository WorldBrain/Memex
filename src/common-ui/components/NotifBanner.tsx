import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { theme } from './design-library/theme'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

export interface ThemeProps {
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
    static defaultProps: Partial<Props> = {
        theme: { width: '100%', iconSize: '24px' },
    }

    render() {
        return (
            <ThemeProvider
                theme={{
                    ...theme,
                    ...NotifBanner.defaultProps.theme,
                    ...this.props.theme,
                }}
            >
                <Banner location={this.props.location}>
                    <MainContent location={this.props.location}>
                        <MainText>{this.props.mainText}</MainText>
                        <ButtonBox location={this.props.location}>
                            <PrimaryAction
                                icon="longArrowRight"
                                fontColor="backgroundColor"
                                iconSize="20px"
                                onClick={this.props.onMainBtnClick}
                                label={this.props.mainBtnText}
                                iconPosition="right"
                            />
                            <Icon
                                icon="removeX"
                                heightAndWidth="22px"
                                onClick={this.props.onCloseBtnClick}
                                color={'black'}
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
    background: ${(props) => props.theme.colors.purple}80;
    height: 60px;
    width: fill-available;
    position: ${({ theme }) => theme.position};
    padding: 0 20px;
    bottom: 0px;
    z-index: 2147483647;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(3px);
    border: 1px solid ${(props) => props.theme.colors.purple};
    margin: 0 10px 10px 10px;
    border-radius: 8px;

    animation: slide-up ease-out;
    animation-duration: 0.2s;

    ${(props) =>
        props.location === 'sidebar' &&
        css`
            grid-gap: 10px;
            margin: 0 10px 10px -10px;
        `}

    ${(props) =>
        props.location === 'search' &&
        css`
            animation: slide-down ease-out;
            animation-duration: 0.1s;
            grid-gap: 10px;
            margin: 10px 10px 10px 10px;
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
    grid-gap: 50px;

    ${(props) =>
        props.location === 'sidebar' || props.location === 'search'
            ? css`
                  grid-gap: 20px;
              `
            : ''}
`
const MainText = styled.span`
    font-size: 16px;
    font-weight: bold;
    margin-right: 30px;
    color: ${(props) => props.theme.colors.backgroundColor};
    white-space: nowrap;
`

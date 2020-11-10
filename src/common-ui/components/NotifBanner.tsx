import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

export interface ThemeProps {
    wide?: boolean
}

export interface Props extends ThemeProps {
    mainText: string
    mainBtnText: string
    onMainBtnClick: React.MouseEventHandler
    onCloseBtnClick: React.MouseEventHandler
}

export class NotifBanner extends React.PureComponent<Props> {
    private get theme(): ThemeProps {
        return {
            wide: this.props.wide,
        }
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <Banner>
                    <MainContent>
                        <MainText>{this.props.mainText}</MainText>
                        <MainBtn onClick={this.props.onMainBtnClick}>
                            {this.props.mainText}
                        </MainBtn>
                    </MainContent>
                    <CloseBtn onClick={this.props.onCloseBtnClick}>X</CloseBtn>
                </Banner>
            </ThemeProvider>
        )
    }
}

const Banner = styled.div`
    display: flex;
    flex-direction: row;
    background: #5cd9a6;
    height: 31px;
    width: 100%;
    ${({ theme }) => (theme.wide ? `padding: 0 300px;` : '')}
`

const MainContent = styled.div``
const MainText = styled.span``
const MainBtn = styled.button``
const CloseBtn = styled.button``

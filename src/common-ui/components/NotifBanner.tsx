import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

interface Theme {
    wide?: boolean
}

export interface Props extends Theme {
    mainText: string
    mainBtnText: string
    onClose: React.MouseEventHandler
    onMainBtnClick: React.MouseEventHandler
}

export class NotifBanner extends React.PureComponent<Props> {
    private get theme(): Theme {
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
                    <CloseBtn onClick={this.props.onMainBtnClick}>X</CloseBtn>
                </Banner>
            </ThemeProvider>
        )
    }
}

const Banner = styled.div`
    background: #5cd9a6;
    height: 31px;
    width: 100%;
    ${({ theme }) => (theme.wide ? `margin: 0 300px;` : '')}
`

const MainContent = styled.div``
const MainText = styled.span``
const MainBtn = styled.button``
const CloseBtn = styled.button``

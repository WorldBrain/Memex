import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface ThemeProps {
    wide?: boolean
}

export interface Props extends ThemeProps {
    mainText: string
    mainBtnText: string
    onMainBtnClick: React.MouseEventHandler
    onCloseBtnClick: React.MouseEventHandler
    location?:string
}

export class NotifBanner extends React.PureComponent<Props> {
    private get theme(): ThemeProps {
        return {
            wide: this.props.wide,
        }
    }

    render() {
        console.log(this.props.location)
        return (
            <ThemeProvider theme={this.theme}>
                <Banner>
                    <MainContent>
                        <MainText>{this.props.mainText}</MainText>
                        <MainBtn onClick={this.props.onMainBtnClick}>
                            {this.props.mainBtnText}
                        </MainBtn>
                    </MainContent>
                    <CloseBtn onClick={this.props.onCloseBtnClick} src={icons.close}/>
                </Banner>
            </ThemeProvider>
        )
    }
}

const Banner = styled.div`
    display: flex;
    flex-direction: row;
    background: #5cd9a6;
    height: 57px;

    ${(props) =>
    props.location === "inpage" ?
        css`
          width: 70px;
        `: css`
          width: 100%;
        `}
    padding: 0 20px;
    position: fixed;
    bottom: 0px;
    z-index: 1000000;
    justify-content: center;
    align-items: center;
    ${({ theme }) => (theme.wide ? `padding: 0 300px;` : '')}
`

const MainContent = styled.div`
    max-width: 770px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
`
const MainText = styled.span`
    font-size: 16px;
    font-weight: bold;
    margin-right: 30px;
`
const MainBtn = styled.button`
    width: 160px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px white solid;
    cursor: pointer;
    border-radius: 3px;
    background: none;
    font-size: 14px;
    outline: none;

    &:hover {
        background-color: white;
    }
`
const CloseBtn = styled.img`
    width: 24px;
    height: 24px;
    padding: 4px;
    cursor: pointer;
    outline: none;
    border-radius: 3px;

    &:hover {
        background-color: #e0e0e0;
    }
`

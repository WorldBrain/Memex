import React, { PureComponent } from 'react'
import styled, { keyframes } from 'styled-components'
import { sizeConstants } from '../../constants'
export interface Props {
    when?: string
    zIndex?: number
}

export default class DayResultGroup extends PureComponent<Props> {
    render() {
        return (
            <DayContainer zIndex={this.props.zIndex}>
                {this.props.when && (
                    <DayWhenText>{this.props.when}</DayWhenText>
                )}
                {this.props.children}
            </DayContainer>
        )
    }
}

const openAnimation = keyframes`
 0% { opacity: 0; margin-top: 30px;}
 100% { opacity: 1; margin-top: 0px;}
`

const DayContainer = styled.div<{ zIndex: number }>`
    display: flex;
    flex-direction: column;
    width: fill-available;
    z-index: ${(props) => props.zIndex};
    max-width: ${sizeConstants.searchResults.widthPx}px;
    animation-name: ${openAnimation};
    animation-duration: 600ms;
    animation-delay: 0ms;
    animation-timing-function: cubic-bezier(0.16, 0.67, 0.41, 0.89);
    animation-fill-mode: backwards;
`

const DayWhenText = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 20px;
    font-weight: 300;
    margin-bottom: 10px;
    margin-top: 30px;
`

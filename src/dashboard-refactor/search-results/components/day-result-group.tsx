import React, { PureComponent } from 'react'
import styled from 'styled-components'
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

const DayContainer = styled.div<{ zIndex: number }>`
    display: flex;
    margin-top: 2px;
    flex-direction: column;
    width: fill-available;
    z-index: ${(props) => props.zIndex};
    max-width: ${sizeConstants.searchResults.widthPx}px;
`

const DayWhenText = styled.h1`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;
`

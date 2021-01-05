import React, { PureComponent } from 'react'
import styled from 'styled-components'

export interface Props {
    when?: string
}

export default class DayResultGroup extends PureComponent<Props> {
    render() {
        return (
            <DayContainer>
                {this.props.when && (
                    <DayWhenText>{this.props.when}</DayWhenText>
                )}
                {this.props.children}
            </DayContainer>
        )
    }
}

const DayContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const DayWhenText = styled.h1``

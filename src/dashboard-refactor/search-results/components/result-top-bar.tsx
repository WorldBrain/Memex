import React, { PureComponent } from 'react'
import styled from 'styled-components'

export interface Props {
    leftSide?: JSX.Element
    rightSide?: JSX.Element
    paddingBottom?: string
}

export default class ResultTopBar extends PureComponent<Props> {
    render() {
        return (
            <TopBarContainer>
                <TopBarSection>{this.props.leftSide}</TopBarSection>
                <TopBarSection>{this.props.rightSide}</TopBarSection>
            </TopBarContainer>
        )
    }
}

const TopBarContainer = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`

const TopBarSection = styled.div`
    display: flex;
    flex-direction: row;
`

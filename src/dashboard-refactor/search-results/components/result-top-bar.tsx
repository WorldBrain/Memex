import React, { PureComponent } from 'react'
import styled from 'styled-components'
import colors from 'src/dashboard-refactor/colors'

export interface Props {
    leftSide?: JSX.Element
    rightSide?: JSX.Element
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
    1px solid ${colors.lighterGrey};
`

const TopBarSection = styled.div``

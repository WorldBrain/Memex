import React, { ReactChild, PureComponent } from 'react'
import styled from 'styled-components'

export interface Props {
    monthlyUpdatesUrl?: string
    roomToImproveUrl?: string
    reportProbUrl?: string
    title?: any
}

class NoResultBadTerm extends PureComponent<Props> {
    static defaultProps = {
        title: 'No Results',
    }

    render() {
        return (
            <div>
                <Title>{this.props.title}</Title>
            </div>
        )
    }
}

const Title = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.greyScale5};
`

const SubTitle = styled.div``

export default NoResultBadTerm

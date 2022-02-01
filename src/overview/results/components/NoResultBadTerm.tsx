import React, { ReactChild, PureComponent } from 'react'
import styled from 'styled-components'

const styles = require('./NoResult.css')

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
                <SubTitle>{this.props.children}</SubTitle>
            </div>
        )
    }
}

const Title = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.lighterText};
`

const SubTitle = styled.div``

export default NoResultBadTerm

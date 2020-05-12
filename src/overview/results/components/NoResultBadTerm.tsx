import React, { ReactChild, PureComponent } from 'react'
import styled from 'styled-components'
import { colorDarkText } from 'src/common-ui/components/design-library/colors'

export interface Props {
    monthlyUpdatesUrl?: string
    roomToImproveUrl?: string
    reportProbUrl?: string
    title?: string
}

class NoResultBadTerm extends PureComponent<Props> {
    static defaultProps = {
        title: 'No Results',
    }

    render() {
        return (
            <Wrapper>
                <Title>{this.props.title}</Title>
                <Subtitle>{this.props.children}</Subtitle>
            </Wrapper>
        )
    }
}

export default NoResultBadTerm

const Wrapper = styled.div`
    max-width: 800px;
`

const Title = styled.div`
    color: ${colorDarkText};
    font-size: 25px;
    font-weight: 700;
    padding-top: 30px;
    margin-bottom: 20px;
    text-align: center;
`

const Subtitle = styled.div`
    color: ${colorDarkText};
    font-size: 17px;
    font-weight: 300;
    margin-bottom: 20px;
    text-align: center;
`

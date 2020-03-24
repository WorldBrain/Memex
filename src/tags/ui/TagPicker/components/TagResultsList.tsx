import React from 'react'
import styled from 'styled-components'
import TagRowItem from './TagRow'

interface Props {
    tags: string[]
    onPress: (tag: string) => void
}

export default class TagResultsList extends React.PureComponent<Props> {
    render = () => (
        <StyledContainer>
            {this.props.tags?.map(tag => (
                <TagRowItem
                    onPress={this.props.onPress}
                    key={`TagKeyName-${tag}`}
                    tag={tag}
                />
            )) || null}
        </StyledContainer>
    )
}
const StyledContainer = styled.div`
    overflow-y: scroll;
`

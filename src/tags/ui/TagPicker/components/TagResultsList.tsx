import React from 'react'
import styled from 'styled-components'
import TagRowItem from './TagRow'
import { Tag } from 'src/tags/background/types'

interface Props {
    tags: Tag[]
    onPress: (tag: Tag) => void
}

export default class TagResultsList extends React.PureComponent<Props> {
    render = () => (
        <StyledContainer>
            {this.props.tags?.map(tag => (
                <TagRowItem
                    {...tag}
                    onPress={this.props.onPress}
                    key={`TagKeyName-${tag.name}`}
                />
            )) || null}
        </StyledContainer>
    )
}
const StyledContainer = styled.div`
    overflow-y: auto;
    max-height: 270px;
`

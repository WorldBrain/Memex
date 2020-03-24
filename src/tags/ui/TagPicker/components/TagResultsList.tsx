import React from 'react'
import styled from 'styled-components'
import TagRowItem from './TagRow'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'

interface Props {
    tags: DisplayTag[]
    onPress: (tag: DisplayTag) => void
}

export default class TagResultsList extends React.Component<Props> {
    render = () => {
        return (
            <StyledContainer id={'tagResults'}>
                {this.props.tags?.map(tag => (
                    <TagRowItem
                        onPress={this.props.onPress}
                        key={`TagKeyName-${tag.name}`}
                        name={tag.name}
                        selected={tag.selected}
                    />
                )) || null}
            </StyledContainer>
        )
    }
}
const StyledContainer = styled.div`
    overflow-y: auto;
    max-height: 270px;
`

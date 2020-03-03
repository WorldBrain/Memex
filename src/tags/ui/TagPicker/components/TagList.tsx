import React from 'react'
import styled from 'styled-components'
import TagRowItem from './TagRow'
import { Tag } from 'src/tags/background/types'

interface Props {
    tags: Tag[]
}

class TagList extends React.PureComponent<Props> {
    render() {
        if (!this.props.tags) {
            return null
        }
        return this.props.tags.map(tag => (
            <TagRowItem {...tag} key={`Tag-${tag.url}`} />
        ))
    }
}

export default styled(TagList)`
    display: flex;
    overflow-y: scroll;
`

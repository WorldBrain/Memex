import React from 'react'
import styled from 'styled-components'
import { Tag } from 'src/tags/background/types'

interface TagRowItemEvents {
    onClick: (tag: Tag) => void
}
type Props = Tag & TagRowItemEvents & {}

class TagRow extends React.PureComponent<Props> {
    onClick = () => {
        const { url, name } = this.props
        this.props.onClick && this.props.onClick({ url, name })
    }

    render() {
        const { name } = this.props
        return <div onClick={this.onClick}>{name}</div>
    }
}

export default styled(TagRow)`
    display: flex;

    :hover {
        background-color: mediumseagreen;
    }
`

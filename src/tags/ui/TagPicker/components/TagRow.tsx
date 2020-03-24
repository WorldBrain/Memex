import React from 'react'
import styled from 'styled-components'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'

interface Props {
    onPress?: (tag: DisplayTag) => void
    name: string
    selected?: boolean
}

class TagRow extends React.PureComponent<Props> {
    handleTagPress = () => {
        this.props.onPress &&
            this.props.onPress({
                name: this.props.name,
                selected: this.props.selected,
            })
    }

    render() {
        const { name } = this.props

        return (
            <Row onClick={this.handleTagPress}>
                <TagResultItem selected={this.props.selected}>
                    {name}
                </TagResultItem>
            </Row>
        )
    }
}

const Row = styled.div`
    border-bottom: 1px solid #e2e2ea;
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    &:hover {
        background: #f7f7f9;
        cursor: pointer;
    }
`

export default TagRow

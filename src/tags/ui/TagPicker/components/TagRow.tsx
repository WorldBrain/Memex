import React from 'react'
import styled from 'styled-components'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'

interface TagRowItemEvents {
    onPress: (tag: string) => void
}
type Props = { tag: string } & TagRowItemEvents & {}

class TagRow extends React.PureComponent<Props> {
    handleTagPress = () => {
        this.props.onPress && this.props.onPress(this.props.tag)
    }

    render() {
        const { tag } = this.props

        return (
            <Row onClick={this.handleTagPress}>
                <TagResultItem>{tag}</TagResultItem>
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

export default styled(TagRow)``

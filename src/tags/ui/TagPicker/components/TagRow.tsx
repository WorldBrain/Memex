import React from 'react'
import styled from 'styled-components'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'
import { Check, Layers } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import { opacify } from 'polished'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'

interface Props {
    onPress?: (tag: DisplayTag) => void
    name: string
    selected?: boolean
}

interface State {
    isHovering: boolean
}

class TagRow extends React.Component<Props, State> {
    state = { isHovering: false }
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
            <Row
                onClick={this.handleTagPress}
                onMouseEnter={() => this.setState({ isHovering: true })}
                onMouseLeave={() => this.setState({ isHovering: false })}
            >
                <TagResultItem
                    selected={this.props.selected}
                    isHovering={this.state.isHovering}
                >
                    {name}
                </TagResultItem>
                <IconStyleWrapper isHovering={this.state.isHovering}>
                    <Layers size={24} />
                    <Check size={24} />
                </IconStyleWrapper>
            </Row>
        )
    }
}

const IconStyleWrapper = styled.div`
    ${StyledIconBase} {
        stroke-width: 2px;
        color: ${props => opacify(0.5, props.theme.tag.subtleIcon)};
        margin-left: 8px;
        opacity: ${props => (props.isHovering ? '1' : '0')};
        transition: all 0.3s;

        &:hover {
            color: ${props => props.theme.tag.hoverIcon};
        }
    }
`

const Row = styled.div`
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.tag.shade};
    display: flex;
    padding: 4px 8px;
    justify-content: space-between;
    transition: background 0.3s;

    &:hover {
        background: ${props => props.theme.tag.shade};
        cursor: pointer;
    }
`

export default TagRow

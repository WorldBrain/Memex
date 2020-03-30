import React from 'react'
import styled from 'styled-components'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'
import { Check, Layers, X as XIcon } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { opacify } from 'polished'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'

interface Props {
    onPress?: (tag: DisplayTag) => void
    onFocus?: (tag: DisplayTag, index: number) => void
    index: number
    name: string
    selected?: boolean
    focused?: boolean
}

class TagRow extends React.Component<Props> {
    handleTagPress = () => {
        const { name, selected, focused } = this.props
        const tag = { name, selected, focused }

        this.props.onPress && this.props.onPress(tag)
    }

    handleMouseEnter = () => {
        const { index, name, selected, focused } = this.props
        const tag = { index, name, selected, focused }

        this.props.onFocus && this.props.onFocus(tag, index)
    }

    render() {
        const { name, selected, focused } = this.props

        // TODO: onClick={this.handleTagPressEvent} add specific layers? or fire event for press? probably event, quite similar
        return (
            <Row
                onClick={this.handleTagPress}
                onMouseEnter={this.handleMouseEnter}
                isFocused={focused}
            >
                <TagResultItem selected={selected} isFocused={focused}>
                    {name}
                </TagResultItem>

                {!selected && (
                    <IconStyleWrapper visibility={this.props.focused}>
                        <ButtonTooltip
                            tooltipText="Tag all tabs in window"
                            position="popupLeft"
                        >
                            <Layers size={24} />
                        </ButtonTooltip>
                        <Check size={24} onClick={this.handleTagPress} />
                    </IconStyleWrapper>
                )}

                {selected && (
                    <IconStyleWrapper visibility={true}>
                        <XIcon size={24} onClick={this.handleTagPress} />
                    </IconStyleWrapper>
                )}
            </Row>
        )
    }
}

const IconStyleWrapper = styled(({ visibility, ...rest }) => <div {...rest} />)`
    display: inline-flex;

    ${StyledIconBase} {
        stroke-width: 2px;
        color: ${props =>
            props.isFocused
                ? props.theme.tag.hoverIcon
                : opacify(0.5, props.theme.tag.subtleIcon)};
        margin-left: 8px;
        opacity: ${props => (props.visibility ? '1' : '0')};
        transition: all 0.3s;
    }
`

const Row = styled.div`
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.tag.shade};
    display: flex;
    padding: 4px 8px;
    justify-content: space-between;
    transition: background 0.3s;
    cursor: pointer;

    background: ${props => props.isFocused && props.theme.tag.shade};
`

export default TagRow

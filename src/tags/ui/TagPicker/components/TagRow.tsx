import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'
import { Check, Layers, X as XIcon } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { opacify } from 'polished'
import { DisplayTag } from 'src/tags/ui/TagPicker/logic'

interface Props {
    onPress?: (tag: DisplayTag) => void
    onFocus?: (tag: DisplayTag, index?: number) => void
    onPressTagAll?: (tag: DisplayTag, index?: number) => void
    index: number
    name: string
    selected?: boolean
    focused?: boolean
}

class TagRow extends React.Component<Props> {
    _getTag = props => {
        const { name, selected, focused } = this.props
        return { name, selected, focused }
    }

    handleTagPress = () => {
        this.props.onPress && this.props.onPress(this._getTag(this.props))
    }

    handleTagAllPress = (e: SyntheticEvent) => {
        this.props.onPressTagAll &&
            this.props.onPressTagAll(this._getTag(this.props))
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    handleMouseEnter = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getTag(this.props), this.props.index)
    }

    handleMouseLeave = () => {
        this.props.onFocus && this.props.onFocus(this._getTag(this.props), null)
    }

    render() {
        const { name, selected, focused } = this.props

        // TODO: onClick={this.handleTagPressEvent} add specific layers? or fire event for press? probably event, quite similar
        return (
            <Row
                onClick={this.handleTagPress}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                isFocused={focused}
            >
                <TagResultItem selected={selected} isFocused={focused}>
                    {name}
                </TagResultItem>

                <IconStyleWrapper visibility={this.props.focused}>
                    {selected && (
                        <XIcon size={24} onClick={this.handleTagPress} />
                    )}
                    <ButtonTooltip
                        tooltipText="Tag all tabs in window"
                        position="popupLeft"
                    >
                        <TagAllTabsButton
                            size={24}
                            onClick={this.handleTagAllPress}
                        />
                    </ButtonTooltip>
                </IconStyleWrapper>
            </Row>
        )
    }
}

const TagAllTabsButton = styled(Layers)`
    pointer-events: auto !important;
`

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
        pointer-events: none;
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

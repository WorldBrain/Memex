import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { ListResultItem } from 'src/custom-lists/ui/CollectionPicker/components/ListResultItem'
import { Check, Layers, X as XIcon } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { opacify } from 'polished'
import { DisplayList } from 'src/custom-lists/ui/CollectionPicker/logic'

interface Props {
    onPress?: (list: DisplayList) => void
    onFocus?: (list: DisplayList, index?: number) => void
    onPressListAll?: (list: DisplayList, index?: number) => void
    index: number
    name: string
    selected?: boolean
    focused?: boolean
}

class ListRow extends React.Component<Props> {
    _getList = (props) => {
        const { name, selected, focused } = this.props
        return { name, selected, focused }
    }

    handleListPress = () => {
        this.props.onPress && this.props.onPress(this._getList(this.props))
    }

    handleListAllPress = (e: SyntheticEvent) => {
        this.props.onPressListAll &&
            this.props.onPressListAll(this._getList(this.props))
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    handleMouseOver = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getList(this.props), this.props.index)
    }

    handleMouseOut = () => {
        this.props.onFocus && this.props.onFocus(this._getList(this.props), null)
    }

    render() {
        const { name, selected, focused, onPressListAll } = this.props

        return (
            <Row
                onClick={this.handleListPress}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                isFocused={focused}
            >
                <ListResultItem selected={selected} isFocused={focused}>
                    {name}
                </ListResultItem>

                <IconStyleWrapper show={focused}>
                    {selected && (
                        <ButtonTooltip
                            tooltipText="Remove from list"
                            position="left"
                        >
                            <XIcon size={20} onClick={this.handleListPress} />
                        </ButtonTooltip>
                    )}
                    {onPressListAll && (
                        <ButtonTooltip
                            tooltipText="Add all tabs in window to list"
                            position="left"
                        >
                            <ListAllTabsButton
                                size={20}
                                onClick={this.handleListAllPress}
                            />
                        </ButtonTooltip>
                    )}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ListAllTabsButton = styled(Layers)`
    pointer-events: auto !important;
`

export const IconStyleWrapper = styled.div`
    display: inline-flex;

    ${StyledIconBase} {
        stroke-width: 2px;
        color: ${(props) =>
            props.isFocused
                ? props.theme.tag.hoverIcon
                : opacify(0.5, props.theme.tag.icon)};
        opacity: ${(props) => (props.show ? '1' : '0')};
        transition: all 0.3s;
        pointer-events: none;
        padding: 2px;
        border-radius: 3px;
        &:hover {
            color: ${(props) => props.theme.tag.iconHover};
            background: ${(props) => props.theme.tag.iconHoverBg};
        }
    }
`

const Row = styled.div`
    align-items: center;
    border-bottom: 1px solid ${(props) => props.theme.border};
    display: flex;
    padding: 4px 20px 4px 12px; // give space to the right for a scrollbar
    justify-content: space-between;
    transition: background 0.3s;
    cursor: pointer;
    background: ${(props) => props.isFocused && props.theme.border};
`

export default ListRow

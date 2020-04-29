import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'
import { Layers, X as XIcon } from '@styled-icons/feather'
import { StyledIconBase } from '@styled-icons/styled-icon'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import { opacify } from 'polished'
import { DisplayEntry } from '../types'

export interface Props {
    onPress?: (entry: DisplayEntry) => void
    onFocus?: (entry: DisplayEntry, index?: number) => void
    onPressActOnAll?: (entry: DisplayEntry, index?: number) => void
    index: number
    name: string
    removeTooltipText?: string
    actOnAllTooltipText?: string
    ResultItem: typeof React.Component
    selected?: boolean
    focused?: boolean
}

class EntryRow extends React.Component<Props> {
    _getEntry = (props) => {
        const { name, selected, focused } = this.props
        return { name, selected, focused }
    }

    handleEntryPress = () => {
        this.props.onPress && this.props.onPress(this._getEntry(this.props))
    }

    handleActOnAllPress = (e: SyntheticEvent) => {
        this.props.onPressActOnAll &&
            this.props.onPressActOnAll(this._getEntry(this.props))
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    handleMouseOver = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getEntry(this.props), this.props.index)
    }

    handleMouseOut = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getEntry(this.props), null)
    }

    render() {
        const {
            name,
            selected,
            focused,
            onPressActOnAll,
            ResultItem,
        } = this.props

        return (
            <Row
                onClick={this.handleEntryPress}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                isFocused={focused}
            >
                <ResultItem selected={selected} isFocused={focused}>
                    {name}
                </ResultItem>

                <IconStyleWrapper show={focused}>
                    {selected && (
                        <ButtonTooltip
                            tooltipText={this.props.removeTooltipText ?? ''}
                            position="left"
                        >
                            <XIcon size={20} onClick={this.handleEntryPress} />
                        </ButtonTooltip>
                    )}
                    {onPressActOnAll && (
                        <ButtonTooltip
                            tooltipText={this.props.actOnAllTooltipText ?? ''}
                            position="left"
                        >
                            <ActOnAllTabsButton
                                size={20}
                                onClick={this.handleActOnAllPress}
                            />
                        </ButtonTooltip>
                    )}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ActOnAllTabsButton = styled(Layers)`
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
    padding: 4px 20px 4px 18px; // give space to the right for a scrollbar
    justify-content: space-between;
    transition: background 0.3s;
    cursor: pointer;
    background: ${(props) => props.isFocused && props.theme.border};
`

export default EntryRow

import React, { SyntheticEvent } from 'react'
import styled, { css } from 'styled-components'
import { Layers } from '@styled-icons/feather'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { SpaceDisplayEntry } from '../logic'

export interface Props extends SpaceDisplayEntry {
    onPress?: (entry: SpaceDisplayEntry) => void
    onFocus?: (entry: SpaceDisplayEntry, index?: number) => void
    onPressActOnAll?: (entry: SpaceDisplayEntry, index?: number) => void
    onContextMenuBtnPress: (entry: SpaceDisplayEntry, index?: number) => void
    index: number
    id?: string
    removeTooltipText?: string
    actOnAllTooltipText?: string
    resultItem: React.ReactNode
    contextMenuBtnRef?: React.RefObject<HTMLDivElement>
    selected?: boolean
}

class EntryRow extends React.Component<Props> {
    _getEntry = () => {
        const {
            name,
            selected,
            focused,
            localId,
            remoteId,
            createdAt,
        } = this.props
        return {
            name,
            selected,
            focused,
            localId,
            remoteId,
            createdAt,
        }
    }

    private handleEntryPress = () => {
        this.props.onPress && this.props.onPress(this._getEntry())
    }

    private handleActOnAllPress: React.MouseEventHandler = (e) => {
        this.props.onPressActOnAll &&
            this.props.onPressActOnAll(this._getEntry())
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private handleContextMenuBtnPress: React.MouseEventHandler = (e) => {
        this.props.onContextMenuBtnPress(this._getEntry())
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private handleMouseOver = () => {
        this.props.onFocus &&
            this.props.onFocus(this._getEntry(), this.props.index)
    }

    private handleMouseOut = () => {
        this.props.onFocus && this.props.onFocus(this._getEntry(), null)
    }

    render() {
        const {
            id,
            focused,
            remoteId,
            selected,
            resultItem,
            onPressActOnAll,
            contextMenuBtnRef,
        } = this.props

        return (
            <Row
                onClick={this.handleEntryPress}
                onMouseOver={this.handleMouseOver}
                onMouseLeave={this.handleMouseOut}
                isFocused={focused}
                id={id}
                title={resultItem['props'].children}
            >
                <NameWrapper>
                    {resultItem}
                    {remoteId != null && (
                        <ButtonTooltip
                            tooltipText={'Shared Space'}
                            position="bottom"
                        >
                            <Icon
                                heightAndWidth="14px"
                                // padding="6px"
                                icon={'people'}
                                hoverOff
                                color="lighterText"
                            />
                        </ButtonTooltip>
                    )}
                </NameWrapper>
                <IconStyleWrapper>
                    {focused && (
                        <ButtonContainer ref={contextMenuBtnRef}>
                            <Icon
                                filePath={icons.dots}
                                heightAndWidth="14px"
                                onClick={this.handleContextMenuBtnPress}
                            />
                        </ButtonContainer>
                    )}
                    {focused && onPressActOnAll && (
                        <ButtonContainer>
                            <ButtonTooltip
                                tooltipText={
                                    this.props.actOnAllTooltipText ?? ''
                                }
                                position="left"
                            >
                                <Icon
                                    filePath={icons.multiEdit}
                                    heightAndWidth="16px"
                                    onClick={this.handleActOnAllPress}
                                />
                            </ButtonTooltip>
                        </ButtonContainer>
                    )}
                    {selected ? (
                        <ButtonContainer selected={selected}>
                            <SelectionBox selected={selected}>
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    color="backgroundColor"
                                />
                            </SelectionBox>
                        </ButtonContainer>
                    ) : focused ? (
                        <ButtonContainer>
                            <SelectionBox selected={selected} />
                        </ButtonContainer>
                    ) : null}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ActOnAllTabsButton = styled(Layers)`
    pointer-events: auto !important;
`

const ButtonContainer = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    border-radius: 5px;
    align-items: center;
`

const SelectionBox = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    background: ${(props) =>
        props.selected
            ? props.theme.colors.normalText
            : props.theme.colors.lightHover};
`

export const IconStyleWrapper = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
`

const Row = styled.div<{ isFocused }>`
    align-items: center;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    height: 40px;
    width: 100%;
    cursor: pointer;
    border-radius: 5px;
    padding: 0 5px;
    margin: 0 2px;
    color: ${(props) => props.isFocused && props.theme.colors.normalText};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
        background: transparent;
    }

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.lineGrey};
            background: transparent;
        `}

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.lineGrey};
        background: transparent;
    }
`

const NameWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 70%;
    font-size: 14px;
    width: 100%;
`

export default EntryRow

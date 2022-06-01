import React, { SyntheticEvent } from 'react'
import styled from 'styled-components'
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
        this.props.onContextMenuBtnPress &&
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
                        <ButtonContainer>
                            <IconImg src={icons.blueRoundCheck} />
                        </ButtonContainer>
                    ) : focused ? (
                        <ButtonContainer>
                            <IconImg src={icons.blueRoundCheck} faded={true} />
                        </ButtonContainer>
                    ) : (
                        <ButtonContainer>
                            <EmptyCircle />
                        </ButtonContainer>
                    )}
                </IconStyleWrapper>
            </Row>
        )
    }
}

export const ActOnAllTabsButton = styled(Layers)`
    pointer-events: auto !important;
`

const ButtonContainer = styled.div`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const IconImg = styled.img<{ faded? }>`
    opacity: ${(props) => props.faded && '0.5'};
    height: 20px;
    width: 20px;
`

const EmptyCircle = styled.div`
    height: 18px;
    width: 18px;
    border-radius: 18px;
    border 2px solid ${(props) => props.theme.colors.lineGrey};
`

export const IconStyleWrapper = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
`

const Row = styled.div`
    align-items: center;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    height: 40px;
    width: 100%;
    cursor: pointer;
    border-radius: 5px;
    padding: 0 10px;
    color: ${(props) => props.isFocused && props.theme.colors.normalText};
    background: ${(props) =>
        props.isFocused && props.theme.colors.backgroundColor};

    &:last-child {
        border-bottom: none;
    }
`

const NameWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 80%;
    font-size: 14px;
`

export default EntryRow

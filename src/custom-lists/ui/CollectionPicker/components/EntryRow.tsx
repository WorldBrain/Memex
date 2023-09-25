import React, { createRef, useRef } from 'react'
import styled, { css } from 'styled-components'
import { Layers } from '@styled-icons/feather'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { UnifiedList } from 'src/annotations/cache/types'
import { runtime } from 'webextension-polyfill'
import { browser } from 'webextension-polyfill-ts'
import { RemoteBGScriptInterface } from 'src/background-script/types'

export interface Props extends Pick<UnifiedList<'user-list'>, 'remoteId'> {
    onPress: () => void
    onFocus: () => void
    onUnfocus: () => void
    onPressActOnAll?: () => void
    onContextMenuBtnPress?: () => void
    index: number
    id?: string
    removeTooltipText?: string
    actOnAllTooltipText?: string
    resultItem: React.ReactNode
    contextMenuBtnRef?: React.RefObject<HTMLDivElement>
    selected?: boolean
    allTabsButtonPressed?: string
    focused?: boolean
    keyboardNavActive?: boolean
    keepScrollPosition?: () => void
    addedToAllIds?: number[]
    onListFocus?: (listId) => void
    goToButtonRef?: React.RefObject<HTMLDivElement>
    localId?: number
    bgScriptBG?: RemoteBGScriptInterface
}

class EntryRow extends React.Component<Props> {
    private handleActOnAllPress: React.MouseEventHandler = (e) => {
        this.props.onPressActOnAll?.()
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private handleContextMenuBtnPress: React.MouseEventHandler = (e) => {
        this.props.onContextMenuBtnPress()
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private resultEntryRef = createRef<HTMLDivElement>()
    private pressAllButtonRef = createRef<HTMLDivElement>()

    state = {
        checkBoxHover: false,
    }

    private handleResultPress: React.MouseEventHandler = (e) => {
        console.log('ref', this.props.goToButtonRef?.current)
        if (!e.shiftKey) {
            if (
                this.props.contextMenuBtnRef?.current.contains(
                    e.target as Node,
                ) ||
                this.props.goToButtonRef?.current.contains(e.target as Node)
            ) {
                return
            }
            if (
                this.props.onPressActOnAll &&
                this.pressAllButtonRef != null &&
                this.pressAllButtonRef?.current.contains(e.target as Node)
            ) {
                return
            }
            this.props.onPress()
        } else {
            this.props.onListFocus(this.props.id)
        }

        this.setState({ checkBoxHover: false })
        this.props.keepScrollPosition()
        e.stopPropagation()
    }

    private scrollIntoView = () => {
        this.resultEntryRef.current.scrollIntoView({
            block: 'center',
        })
    }

    private handleOpenSpaceFromPicker: React.MouseEventHandler = async (
        event,
    ) => {
        await this.props.bgScriptBG?.openOverviewTab({
            // TODO: fix type but list.localId is not working. Tetst by clicking on the pills in telegram/twitter. They should jump to the right space in the dashboard
            /** @ts-ignore */
            selectedSpace: this.props.localId,
        })
        event.preventDefault()
        event.stopPropagation()
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
            goToButtonRef,
            keyboardNavActive,
        } = this.props

        let cleanID = parseInt(id.split('ListKeyName-')[1])

        if (keyboardNavActive && focused && this.resultEntryRef.current) {
            this.scrollIntoView()
        }

        return (
            <Row
                onMouseDown={this.handleResultPress}
                ref={this.resultEntryRef}
                onMouseEnter={() => {
                    if (!keyboardNavActive) {
                        this.props.onFocus()
                    }
                }}
                // onMouseLeave={!keyboardNavActive && this.props.onUnfocus}
                isFocused={focused}
                id={id}
                title={resultItem['props'].children}
                zIndex={10000 - this.props.index}
            >
                <NameWrapper>
                    {resultItem}
                    {remoteId != null && (
                        <TooltipBox
                            tooltipText={'Shared Space'}
                            placement="bottom"
                        >
                            <Icon
                                heightAndWidth="14px"
                                // padding="6px"
                                icon={'peopleFine'}
                                hoverOff
                                color="greyScale5"
                            />
                        </TooltipBox>
                    )}
                </NameWrapper>
                <IconStyleWrapper>
                    {focused && this.props.onContextMenuBtnPress != null && (
                        <>
                            <TooltipBox
                                tooltipText={'Share & Edit Space'}
                                placement="bottom"
                                targetElementRef={contextMenuBtnRef?.current}
                            >
                                <ButtonContainer ref={contextMenuBtnRef}>
                                    <Icon
                                        filePath={icons.invite}
                                        heightAndWidth="20px"
                                        onClick={this.handleContextMenuBtnPress}
                                    />
                                </ButtonContainer>
                            </TooltipBox>

                            <TooltipBox
                                tooltipText={'Go to Space'}
                                placement="bottom"
                                targetElementRef={goToButtonRef?.current}
                            >
                                <ButtonContainer ref={goToButtonRef}>
                                    <Icon
                                        filePath={icons.goTo}
                                        heightAndWidth="20px"
                                        onClick={this.handleOpenSpaceFromPicker}
                                    />
                                </ButtonContainer>
                            </TooltipBox>
                        </>
                    )}
                    {focused && onPressActOnAll && (
                        <ButtonContainer>
                            {this.props.addedToAllIds.includes(cleanID) ? (
                                <TooltipBox
                                    tooltipText={
                                        <>
                                            All open tabs in this window
                                            <br /> have been added to this Space
                                        </>
                                    }
                                    placement="top"
                                >
                                    <Icon
                                        filePath={icons.checkRound}
                                        heightAndWidth="20px"
                                        containerRef={this.pressAllButtonRef}
                                    />
                                </TooltipBox>
                            ) : (
                                <TooltipBox
                                    tooltipText={
                                        this.props.actOnAllTooltipText ?? ''
                                    }
                                    placement="bottom"
                                >
                                    <Icon
                                        filePath={icons.multiEdit}
                                        heightAndWidth="20px"
                                        onClick={this.handleActOnAllPress}
                                        containerRef={this.pressAllButtonRef}
                                    />
                                </TooltipBox>
                            )}
                        </ButtonContainer>
                    )}
                    {/* 
                    {selected && !focused && (
                        <ButtonContainer selected={selected}>
                            <SelectionBox
                                onMouseEnter={() =>
                                    this.setState({ checkBoxHover: true })
                                }
                                onMouseLeave={() =>
                                    this.setState({ checkBoxHover: false })
                                }
                                selected={selected}
                            >
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    hoverOff
                                    color={
                                        !this.state.checkBoxHover
                                            ? 'black'
                                            : 'greyScale2'
                                    }
                                />
                            </SelectionBox>
                        </ButtonContainer>
                    )} */}
                    {selected && (
                        <ButtonContainer selected={selected}>
                            <SelectionBox
                                onMouseEnter={() =>
                                    this.setState({ checkBoxHover: true })
                                }
                                onMouseLeave={() =>
                                    this.setState({ checkBoxHover: false })
                                }
                                selected={selected}
                            >
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    hoverOff
                                    color={
                                        !this.state.checkBoxHover
                                            ? 'black'
                                            : 'greyScale5'
                                    }
                                />
                            </SelectionBox>
                        </ButtonContainer>
                    )}
                    {!selected && focused && (
                        <ButtonContainer>
                            <SelectionBox
                                onMouseEnter={() =>
                                    this.setState({ checkBoxHover: true })
                                }
                                onMouseLeave={() =>
                                    this.setState({ checkBoxHover: false })
                                }
                                selected={selected}
                            >
                                <Icon
                                    icon={icons.check}
                                    heightAndWidth="16px"
                                    hoverOff
                                    color={
                                        !this.state.checkBoxHover
                                            ? 'greyScale1'
                                            : 'white'
                                    }
                                />
                            </SelectionBox>
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

const ButtonContainer = styled.div<{ selected }>`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    border-radius: 5px;
    align-items: center;
    cursor: pointer;

    * {
        cursor: pointer;
    }
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
            ? props.theme.colors.greyScale7
            : props.theme.colors.greyScale3};

    ${(props) =>
        props.theme.variant === 'light' &&
        css<any>`
            background: ${(props) =>
                props.selected
                    ? props.theme.colors.greyScale4
                    : props.theme.colors.greyScale3};
        `};
`

export const IconStyleWrapper = styled.div`
    display: flex;
    grid-gap: 15px;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
`

const Row = styled.div<{ isFocused; zIndex }>`
    align-items: center;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    height: 40px;
    width: fill-available;
    cursor: pointer;
    border-radius: 5px;
    padding: 0 9px;
    margin: 0 -5px;
    overflow: visible;
    color: ${(props) => props.isFocused && props.theme.colors.greyScale6};
    z-index: ${(props) =>
        props.isFocused ? props.zIndex + 1000 : props.zIndex};
    &:last-child {
        border-bottom: none;
    }

    /* &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    } */

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
            background: transparent;
        `}

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        background: transparent;
    }

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            &:focus {
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
            }
            &:hover {
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
                background: transparent;
            }

            ${(props) =>
                props.isFocused &&
                css`
                    outline: 1px solid
                        ${(props) => props.theme.colors.greyScale2};
                    background: transparent;
                `}
        `};
`

const NameWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 80%;
    font-size: 14px;
    width: 100%;
    min-width: 50px;
    flex: 1;
`

export default EntryRow

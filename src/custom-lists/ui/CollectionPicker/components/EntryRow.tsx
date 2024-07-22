import React, { createRef } from 'react'
import styled, { css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { UnifiedList } from 'src/annotations/cache/types'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import type { DragNDropActions, ListTreeActions } from '../../list-trees/types'

export interface Props extends Pick<UnifiedList<'user-list'>, 'remoteId'> {
    onPress: () => void
    onFocus: () => void
    onUnfocus: () => void
    onPressActOnAll?: () => void
    onContextMenuBtnPress?: () => void
    onEditMenuBtnPress?: () => void
    onOpenInTabGroupPress?: () => void
    index: number
    shareState: 'private' | 'shared'
    id?: string
    actOnAllTooltipText?: string
    resultItem: React.ReactNode
    contextMenuBtnRef?: React.RefObject<HTMLDivElement>
    editMenuBtnRef?: React.RefObject<HTMLDivElement>
    openInTabGroupButtonRef?: React.RefObject<HTMLDivElement>
    extraMenuBtnRef?: React.RefObject<HTMLDivElement>
    selected?: boolean
    focused?: boolean
    keepScrollPosition?: () => void
    addedToAllIds?: number[]
    onListFocus?: (listId: string) => void
    goToButtonRef?: React.RefObject<HTMLDivElement>
    bgScriptBG: RemoteBGScriptInterface<'caller'>
    onAncestryPathClick?: React.MouseEventHandler
    ancestryPath?: React.ReactChild[]
    getRootElement?: () => HTMLElement
    renderLeftSideIcon?: () => JSX.Element
    toggleShowNewChildInput?: ListTreeActions['toggleShowNewChildInput']
    dndActions?: DragNDropActions
    indentSteps?: number
    blockMouseOver?: boolean
}

interface State {
    checkBoxHover: boolean
    mouseOverItem: boolean
    showExtraMenu: boolean
    confirmOpenAll: boolean
}

class EntryRow extends React.PureComponent<Props, State> {
    private resultEntryRef = createRef<HTMLDivElement>()
    private pressAllButtonRef = createRef<HTMLDivElement>()
    private addSubSpaceIconRef = React.createRef<HTMLDivElement>()

    state: State = {
        checkBoxHover: false,
        mouseOverItem: false,
        showExtraMenu: false,
        confirmOpenAll: false,
    }

    private handleActOnAllPress: React.MouseEventHandler = (e) => {
        this.props.onPressActOnAll?.()
        e.stopPropagation()
        return false
    }

    private handleContextMenuBtnPress: React.MouseEventHandler = (e) => {
        this.props.onContextMenuBtnPress()
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private handleEditMenuBtnPress: React.MouseEventHandler = (e) => {
        this.props.onEditMenuBtnPress()
        e.preventDefault()
        e.stopPropagation()
        return false
    }

    private handleOpenInTabGroup: React.MouseEventHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (this.state.confirmOpenAll) {
            this.props.onOpenInTabGroupPress()
            e.preventDefault()
            e.stopPropagation()
            setTimeout(() => {
                this.setState({
                    confirmOpenAll: false,
                })
            }, 2000)
        } else {
            this.setState({
                confirmOpenAll: true,
            })
            e.preventDefault()
            e.stopPropagation()
        }

        return false
    }

    private handleResultPress: React.MouseEventHandler = (e) => {
        if (!e.shiftKey) {
            if (
                this.props.contextMenuBtnRef?.current?.contains(
                    e.target as Node,
                ) ||
                this.props.goToButtonRef?.current?.contains(e.target as Node) ||
                this.props.editMenuBtnRef?.current?.contains(
                    e.target as Node,
                ) ||
                this.props.extraMenuBtnRef?.current?.contains(
                    e.target as Node,
                ) ||
                this.props.openInTabGroupButtonRef?.current?.contains(
                    e.target as Node,
                ) ||
                this.state.showExtraMenu
            ) {
                return
            }
            if (
                this.props.onPressActOnAll &&
                this.pressAllButtonRef != null &&
                this.pressAllButtonRef?.current?.contains(e.target as Node)
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

    scrollIntoView = () => {
        this.resultEntryRef?.current.scrollIntoView({
            block: 'center',
        })
    }

    private renderShowExtraMenu(cleanID: number) {
        if (!this.state.showExtraMenu) {
            return null
        }
        return (
            <PopoutBox
                targetElementRef={this.props.extraMenuBtnRef?.current}
                placement="top-end"
                offsetX={10}
                closeComponent={() => {
                    this.setState({ showExtraMenu: false })
                }}
                getPortalRoot={this.props.getRootElement}
                blockedBackground={true}
            >
                <ExtraMenuContainer>
                    <PrimaryAction
                        onClick={this.handleOpenSpaceFromPicker}
                        icon="goTo"
                        size="medium"
                        type="tertiary"
                        fullWidth
                        label="Go to Space"
                        innerRef={this.props.goToButtonRef}
                        contentAlign={'flex-start'}
                        width="100%"
                    />
                    <PrimaryAction
                        onClick={this.handleEditMenuBtnPress}
                        icon="edit"
                        size="medium"
                        type="tertiary"
                        fullWidth
                        label="Rename & Delete"
                        innerRef={this.props.editMenuBtnRef}
                        contentAlign={'flex-start'}
                        width="100%"
                    />
                    <PrimaryAction
                        onClick={this.handleOpenInTabGroup}
                        icon="goTo"
                        size="medium"
                        type="tertiary"
                        fullWidth
                        label={
                            this.state.confirmOpenAll
                                ? 'Confirm opening all urls'
                                : 'Open all pages in new window'
                        }
                        innerRef={this.props.openInTabGroupButtonRef}
                        contentAlign={'flex-start'}
                        width="100%"
                    />
                    {this.props.addedToAllIds.includes(cleanID) ? (
                        <TooltipBox
                            tooltipText={
                                <>
                                    All open tabs in this window
                                    <br /> have been added to this Space
                                </>
                            }
                            placement="top"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <PrimaryAction
                                icon={'checkRound'}
                                size="medium"
                                type="tertiary"
                                fullWidth
                                label="Added all tabs in window"
                                innerRef={this.pressAllButtonRef}
                                onClick={null}
                                contentAlign={'flex-start'}
                                width="100%"
                            />
                        </TooltipBox>
                    ) : (
                        <TooltipBox
                            tooltipText={this.props.actOnAllTooltipText ?? ''}
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <PrimaryAction
                                icon={'multiEdit'}
                                size="medium"
                                type="tertiary"
                                fullWidth
                                label="Add all tabs in window"
                                innerRef={this.pressAllButtonRef}
                                onClick={this.handleActOnAllPress}
                                contentAlign={'flex-start'}
                                width="100%"
                            />
                        </TooltipBox>
                    )}
                </ExtraMenuContainer>
            </PopoutBox>
        )
    }

    private handleOpenSpaceFromPicker: React.MouseEventHandler = async (
        event,
    ) => {
        await this.props.bgScriptBG.openOverviewTab({
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
            selected,
            resultItem,
            contextMenuBtnRef,
            shareState,
            dndActions,
        } = this.props

        let cleanID = parseInt(id.split('ListKeyName-')[1])

        return (
            <Row
                onDragStart={dndActions?.onDragStart}
                onDragEnd={dndActions?.onDragEnd}
                draggable
                onClick={this.handleResultPress}
                ref={this.resultEntryRef}
                onMouseOver={() => {
                    if (!this.props.blockMouseOver) {
                        this.setState({ mouseOverItem: true })
                        this.props.onFocus()
                    }
                }}
                onMouseEnter={() => {
                    if (!this.props.blockMouseOver) {
                        this.setState({ mouseOverItem: true })
                        this.props.onFocus()
                    }
                }}
                onMouseLeave={() => {
                    if (!this.props.blockMouseOver) {
                        this.setState({ mouseOverItem: false })
                    }
                }}
                isFocused={focused || this.state.showExtraMenu}
                id={id}
                title={resultItem['props'].children}
                zIndex={10000 - this.props.index}
                indentSteps={this.props.indentSteps ?? 0}
            >
                <LeftSideIconContainer>
                    {this.props.renderLeftSideIcon?.()}
                </LeftSideIconContainer>
                <NameWrapper>
                    {this.props.ancestryPath?.length > 0 && (
                        <TooltipBox
                            tooltipText="Toggle Path"
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <PathBox onClick={this.props.onAncestryPathClick}>
                                {this.props.ancestryPath}{' '}
                            </PathBox>
                        </TooltipBox>
                    )}
                    <NameRow>
                        {resultItem}
                        {shareState === 'shared' && (
                            <TooltipBox
                                tooltipText={'Shared Space'}
                                placement="bottom"
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    heightAndWidth="14px"
                                    icon={'peopleFine'}
                                    hoverOff
                                    color="greyScale5"
                                />
                            </TooltipBox>
                        )}
                    </NameRow>
                </NameWrapper>
                <IconStyleWrapper
                    shouldMoveBottomRight={this.props.ancestryPath?.length > 0}
                    mouseOverResult={focused || this.state.mouseOverItem}
                >
                    {(((focused || this.state.mouseOverItem) &&
                        this.props.onContextMenuBtnPress != null) ||
                        this.state.showExtraMenu) && (
                        <>
                            {this.renderShowExtraMenu(cleanID)}
                            <TooltipBox
                                tooltipText="Add Sub-Space"
                                placement="right"
                                targetElementRef={
                                    this.addSubSpaceIconRef.current
                                }
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    containerRef={this.addSubSpaceIconRef}
                                    icon="plus"
                                    heightAndWidth="20px"
                                    color="greyScale5"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        this.props.toggleShowNewChildInput()
                                    }}
                                />
                            </TooltipBox>
                            <TooltipBox
                                tooltipText={'More Options'}
                                placement="bottom"
                                targetElementRef={
                                    this.props.extraMenuBtnRef?.current
                                }
                                getPortalRoot={this.props.getRootElement}
                            >
                                <ButtonContainer
                                    ref={this.props.extraMenuBtnRef}
                                >
                                    <Icon
                                        filePath={icons.dots}
                                        heightAndWidth="20px"
                                        onClick={() =>
                                            this.setState({
                                                showExtraMenu: true,
                                            })
                                        }
                                        background={
                                            this.state.showExtraMenu
                                                ? 'greyScale3'
                                                : null
                                        }
                                    />
                                </ButtonContainer>
                            </TooltipBox>
                            <TooltipBox
                                tooltipText={'Share Space'}
                                placement="bottom"
                                targetElementRef={contextMenuBtnRef?.current}
                                getPortalRoot={this.props.getRootElement}
                            >
                                <ButtonContainer ref={contextMenuBtnRef}>
                                    <Icon
                                        filePath={icons.invite}
                                        heightAndWidth="20px"
                                        onClick={this.handleContextMenuBtnPress}
                                    />
                                </ButtonContainer>
                            </TooltipBox>
                        </>
                    )}
                    {selected && (
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

const LeftSideIconContainer = styled.div``

export const ActOnAllTabsButton = styled.div`
    pointer-events: auto !important;
`

const ButtonContainer = styled.div`
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

const ExtraMenuContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
    grid-gap: 6px;

    & > div {
        width: 100%;
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

export const IconStyleWrapper = styled.div<{
    shouldMoveBottomRight: boolean
    mouseOverResult: boolean
}>`
    display: flex;
    grid-gap: 15px;
    align-items: center;
    justify-content: flex-end;
    height: fit-content;
    position: absolute;
    right: 5px;
    padding: 5px 5px 5px 10px;

    ${(props) =>
        props.mouseOverResult &&
        css`
            border-radius: 6px;
            background: ${(props) => props.theme.colors.greyScale2};
        `}

    ${(props) =>
        props.shouldMoveBottomRight &&
        props.mouseOverResult &&
        css`
            background: ${(props) => props.theme.colors.greyScale2};
            border-radius: 6px 0 6px 0;
            bottom: 0px;
            height: fit-content;
            padding: 5px 10px;
            right: 0px;
            box-sizing: border-box;
        `}
`

const Row = styled.div<{
    isFocused: boolean
    zIndex: number
    indentSteps: number
}>`
    align-items: center;
    display: flex;
    justify-content: flex-start;
    transition: background 0.3s;

    height: 60px;
    width: fill-available;
    cursor: pointer;
    padding: 0px 0px 0 ${({ indentSteps }) => 9 + indentSteps * 15}px;
    box-sizing: border-box;
    margin: 0 0px;
    overflow: visible;
    color: ${(props) => props.isFocused && props.theme.colors.greyScale6};
    z-index: ${(props) =>
        props.isFocused ? props.zIndex + 1000 : props.zIndex};
    &:last-child {
        border-bottom: none;
    }

    ${(props) =>
        props.isFocused &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale4};
            background: transparent;
        `}

    &:focus {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
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
    flex-direction: column;
    align-items: flex-start;
    padding-left: 10px;
    grid-gap: 2px;
    max-width: 80%;
    font-size: 14px;
    width: 100%;
    min-width: 50px;
    flex: 1;
`

const PathBox = styled.div`
    display: flex;
    justify-content: flex-start;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
    grid-gap: 0px;
    padding: 0 3px;
    margin: 0 -3px;
    border-radius: 5px;
    align-items: center;
    white-space: nowrap;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale2};
        cursor: pointer;
        color: ${(props) => props.theme.colors.greyScale7};
    }
`

const NameRow = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    width: 100%;
    text-align: left;
    justify-content: flex-start;
`

export default EntryRow

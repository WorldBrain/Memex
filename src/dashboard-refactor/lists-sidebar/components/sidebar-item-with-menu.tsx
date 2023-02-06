import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DropReceivingState, SelectedState } from 'src/dashboard-refactor/types'
import { Props as EditableItemProps } from './sidebar-editable-item'
import { ListData, ListNameHighlightIndices } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import SpaceContextMenuButton from './space-context-menu-btn'
import {
    contentSharing,
    collections,
} from 'src/util/remote-functions-background'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

export interface Props {
    className?: string
    isEditing?: boolean
    newItemsCount?: number
    name: string
    listId: number
    listData?: ListData
    hasActivity?: boolean
    isMenuDisplayed?: boolean
    isCollaborative?: boolean
    nameHighlightIndices?: ListNameHighlightIndices
    onUnfollowClick?: React.MouseEventHandler
    onRenameClick?: React.MouseEventHandler
    onDeleteClick?: React.MouseEventHandler
    onDeleteConfirm?: React.MouseEventHandler
    onSpaceShare?: (remoteListId: string) => Promise<void>
    dropReceivingState?: DropReceivingState
    editableProps?: EditableItemProps
    selectedState: SelectedState
    changeListName?: (value: string) => void
    onMoreActionClick?: React.MouseEventHandler
    shareList?: () => Promise<void>
    selectedListId?: number
}

export interface State {
    hoverOverListItem: boolean
}

export default class ListsSidebarItemWithMenu extends React.Component<
    Props,
    State
> {
    private handleSelection: React.MouseEventHandler = (e) => {
        if (this.props.listId !== this.props.selectedListId) {
            this.props.selectedState.onSelection(this.props.listId)
        }
    }

    state = {
        hoverOverListItem: false,
    }
    private handleDragEnter: React.DragEventHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // Needed to push this op back on the event queue, so it fires after the previous
        //  list item's `onDropLeave` event
        setTimeout(() => this.props.dropReceivingState?.onDragEnter(), 0)
    }

    private handleDrop: React.DragEventHandler = (e) => {
        e.preventDefault()
        if (!this.props.dropReceivingState?.canReceiveDroppedItems) {
            return
        }
        this.props.dropReceivingState?.onDrop(e.dataTransfer)
    }

    private renderIcon() {
        const {
            dropReceivingState,
            onMoreActionClick,
            newItemsCount,
            onSpaceShare,
            listData,
            listId,
        } = this.props

        if (newItemsCount) {
            return (
                <NewItemsCount>
                    <NewItemsCountInnerDiv>
                        {newItemsCount}
                    </NewItemsCountInnerDiv>
                </NewItemsCount>
            )
        }

        if (listId === 20201016) {
            if (this.props.hasActivity) {
                return (
                    <IconContainer>
                        <ActivityBeacon />
                    </IconContainer>
                )
            }
        }

        if (listId === 2020101) {
            if (this.props.hasActivity) {
                return (
                    <IconContainer>
                        <ActivityBeacon />
                    </IconContainer>
                )
            }
        }

        if (dropReceivingState?.wasPageDropped) {
            return (
                <Icon
                    heightAndWidth="20px"
                    color="prime1"
                    filePath={icons.check}
                />
            )
        }

        if (
            dropReceivingState?.canReceiveDroppedItems &&
            dropReceivingState?.isDraggedOver
        ) {
            return (
                <Icon
                    heightAndWidth="20px"
                    color="prime1"
                    filePath={icons.plus}
                />
            )
        }

        if (onMoreActionClick) {
            return (
                <SpaceContextMenuButton
                    contentSharingBG={contentSharing}
                    spacesBG={collections}
                    spaceName={listData.name}
                    localListId={listData.id}
                    remoteListId={listData.remoteId}
                    toggleMenu={this.props.onMoreActionClick}
                    editableProps={this.props.editableProps!}
                    isMenuDisplayed={this.props.isMenuDisplayed}
                    onDeleteSpaceIntent={this.props.onDeleteClick}
                    onSpaceShare={onSpaceShare}
                    // cancelSpaceNameEdit={this.props.cancelSpaceNameEdit()}
                />
            )
        }
    }

    private renderListIcon(listId) {
        if (listId === 20201015) {
            return (
                <IconContainer>
                    <Icon
                        filePath={icons.phone}
                        heightAndWidth="18px"
                        hoverOff
                        color={
                            this.props.selectedState.isSelected
                                ? 'prime1'
                                : null
                        }
                    />
                </IconContainer>
            )
        }
        if (listId === 20201014) {
            return (
                <IconContainer>
                    <Icon
                        filePath={icons.inbox}
                        heightAndWidth="18px"
                        hoverOff
                        color={
                            this.props.selectedState.isSelected
                                ? 'prime1'
                                : null
                        }
                    />
                </IconContainer>
            )
        }
        if (listId === -1) {
            return (
                <IconContainer>
                    <Icon
                        filePath={icons.heartEmpty}
                        heightAndWidth="18px"
                        hoverOff
                        color={
                            this.props.selectedState.isSelected
                                ? 'prime1'
                                : null
                        }
                    />
                </IconContainer>
            )
        }

        if (listId === 20201016) {
            return (
                <IconContainer>
                    <Icon
                        filePath={icons.feed}
                        heightAndWidth="20px"
                        hoverOff
                    />
                </IconContainer>
            )
        }
    }

    private renderTitle() {
        const { dropReceivingState } = this.props

        const collaborationIcon = this.props.isCollaborative && (
            <>
                <TooltipBox tooltipText={'Shared Space'} placement="bottom">
                    <Icon heightAndWidth="18px" icon={'peopleFine'} hoverOff />
                </TooltipBox>
            </>
        )

        if (!this.props.nameHighlightIndices) {
            return (
                <ListTitle
                    selectedState={this.props.selectedState}
                    {...this.props}
                >
                    {this.renderListIcon(this.props.listId)}
                    <Name>{this.props.name}</Name>
                    {collaborationIcon}
                </ListTitle>
            )
        }

        const [from, to] = this.props.nameHighlightIndices

        const [namePre, nameHighlighted, namePost] = [
            this.props.name.slice(0, from),
            this.props.name.slice(from, to),
            this.props.name.slice(to),
        ]

        return (
            <ListTitle selectedState={this.props.selectedState}>
                {namePre.length > 0 && <span>{namePre}</span>}
                <span style={{ fontWeight: fonts.primary.weight.bold }}>
                    {nameHighlighted} test
                </span>
                {namePost.length > 0 && <span>{namePost}</span>}
                {collaborationIcon}
            </ListTitle>
        )
    }

    render() {
        const {
            dropReceivingState,
            isMenuDisplayed,
            selectedState,
            newItemsCount,
            hasActivity,
            listId,
        } = this.props

        return (
            <Container>
                <SidebarItem
                    isMenuDisplayed={isMenuDisplayed}
                    selectedState={selectedState}
                    dropReceivingState={dropReceivingState}
                    //title={this.props.name}
                    onClick={this.handleSelection}
                    onDragEnter={this.handleDragEnter}
                    onDragLeave={dropReceivingState?.onDragLeave}
                    onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }} // Needed to allow the `onDrop` event to fire
                    onDrop={this.handleDrop}
                    onMouseEnter={() =>
                        this.setState({ hoverOverListItem: true })
                    }
                    onMouseOver={() =>
                        this.setState({ hoverOverListItem: true })
                    }
                    onMouseLeave={() =>
                        this.setState({ hoverOverListItem: false })
                    }
                >
                    <TitleBox> {this.renderTitle()}</TitleBox>

                    <IconBox
                        dropReceivingState={dropReceivingState}
                        newItemsCount={newItemsCount}
                        listId={listId}
                        hasActivity={hasActivity}
                        right="10px"
                        hoverOverListItem={this.state.hoverOverListItem}
                        isMenuDisplayed={isMenuDisplayed}
                    >
                        {this.renderIcon()}
                    </IconBox>
                </SidebarItem>
            </Container>
        )
    }
}

const Container = styled.div`
    position: relative;
`

const Name = styled.div`
    display: block;
    overflow-x: hidden;
    text-overflow: ellipsis;
    color: ${(props) => props.theme.colors.greyScale6};
`

const IconBox = styled.div<{
    hoverOverListItem: boolean
    listId: number
    dropReceiveingState: DropReceivingState
}>`
    display: none;
    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    padding-left: 5px;
    z-index: 1;

    // list all states in which display flex

    ${(props) =>
        (props.hoverOverListItem ||
            props.newItemsCount ||
            props.dropReceivingState?.isDraggedOver ||
            props.dropReceivingState?.wasPageDropped ||
            props.isActivityFeed ||
            props.listId === 20201014 ||
            props.listId === 20201015 ||
            props.listId === 20201016 ||
            props.isMenuDisplayed) &&
        css`
            display: flex;
        `}
`

const DropZoneMask = styled.div`
    height: inherit;
    width: inherit;
    position: absolute;
    background: red;
    width: fill-available;
    z-index: 2;
`

const TitleBox = styled.div<Props>`
    display: flex;
    flex: 0 1 100%;
    width: 91%;
    height: 100%;
    padding-left: 14px;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale5};
`

const SidebarItem = styled.div<Props>`
    height: 40px;
    margin: 5px 12px;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: ${(props) =>
        props.dropReceivingState?.isDraggedOver
            ? props.theme.colors.greyScale1
            : 'transparent'};


    &:hover ${TitleBox} {
        width: 70%;
    }

    ${({ selectedState }: Props) =>
        selectedState?.isSelected &&
        css`
            color: ${(props) => props.theme.colors.darkText};
            background: ${(props) => props.theme.colors.greyScale2};
        `}


    cursor: ${({ dropReceivingState }: Props) =>
        !dropReceivingState?.isDraggedOver
            ? `pointer`
            : dropReceivingState?.canReceiveDroppedItems
            ? `pointer`
            : `not-allowed`};

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};

        ${({ selectedState }: Props) =>
            selectedState?.isSelected &&
            css`
                background: ${(props) => props.theme.colors.greyScale2};
            `}
    }

    ${(props) =>
        props.dropReceivingState?.isDraggedOver &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        `}`

const ListTitle = styled.span<Props>`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: 400;
    font-style: normal;
    font-size: 14px;
    line-height: 22px;
    height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 20px;
    justify-content: flex-start;
    width: 100%;
    pointer-events: none;
`

const IconContainer = styled.div`
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ActivityBeaconEmpty = styled.div`
    height: 14px;
    width: 14px;
    border-radius: 20px;
    border: 1.5px solid ${(props) => props.theme.colorsgreyScale6};
`

const ActivityBeacon = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 20px;
    background-color: ${(props) => props.theme.colors.prime1};
`

const NewItemsCount = styled.div`
    width: fit-content;
    min-width: 20px;
    height: 14px;
    border-radius: 30px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background-color: ${(props) => props.theme.colors.prime1};
    padding: 2px 4px;
    color: ${(props) => props.theme.colors.black};
    text-align: center;
    font-weight: 500;
    justify-content: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    padding: 2px 0px;
`

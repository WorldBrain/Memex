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
import { ButtonTooltip } from 'src/common-ui/components'
import {
    contentSharing,
    collections,
} from 'src/util/remote-functions-background'

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
}

export default class ListsSidebarItemWithMenu extends PureComponent<Props> {
    private handleSelection: React.MouseEventHandler = (e) =>
        this.props.selectedState.onSelection(this.props.listId)

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

        if (dropReceivingState?.wasPageDropped) {
            return <Icon heightAndWidth="14px" filePath={icons.check} />
        }

        if (
            dropReceivingState?.canReceiveDroppedItems &&
            dropReceivingState?.isDraggedOver
        ) {
            return <Icon heightAndWidth="14px" filePath={icons.plus} />
        }

        if (onMoreActionClick) {
            return (
                <SpaceContextMenuButton
                    contentSharingBG={contentSharing}
                    spacesBG={collections}
                    spaceName={listData.name}
                    localListId={listData.id}
                    remoteListId={listData.remoteId}
                    onClose={this.props.editableProps!.onCancelClick}
                    toggleMenu={this.props.onMoreActionClick}
                    editableProps={this.props.editableProps!}
                    isMenuDisplayed={this.props.isMenuDisplayed}
                    onSpaceShare={onSpaceShare}
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
                                ? 'purple'
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
                                ? 'purple'
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
                                ? 'purple'
                                : null
                        }
                    />
                </IconContainer>
            )
        }

        if (listId === 20201016) {
            if (this.props.hasActivity) {
                return (
                    <IconContainer>
                        <ActivityBeacon />
                    </IconContainer>
                )
            } else {
                return (
                    <IconContainer>
                        <Icon
                            filePath={icons.emptyCircle}
                            heightAndWidth="16px"
                            hoverOff
                        />
                    </IconContainer>
                )
            }
        }
    }

    private renderTitle() {
        const { dropReceivingState } = this.props

        const collaborationIcon = this.props.isCollaborative && (
            <>
                <ButtonTooltip tooltipText={'Shared Space'} position="bottom">
                    <Icon heightAndWidth="14px" icon={'people'} hoverOff />
                </ButtonTooltip>
            </>
        )

        if (!this.props.nameHighlightIndices) {
            return (
                <ListTitle
                    selectedState={this.props.selectedState}
                    // dropReceivingState={dropReceivingState}
                    // onDragLeave={dropReceivingState?.onDragLeave}
                    // onDragEnter={this.handleDragEnter}
                    // onDragOver={(e) => e.preventDefault()} // Needed to allow the `onDrop` event to fire
                    // onDrop={this.handleDrop}
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
                >
                    <TitleBox> {this.renderTitle()}</TitleBox>

                    <IconBox
                        dropReceivingState={dropReceivingState}
                        newItemsCount={newItemsCount}
                        hasActivity={hasActivity}
                        // onClick={this.handleMoreActionClick}
                        right="10px"
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
    color: ${(props) => props.theme.colors.normalText};
`

const MenuContainer = styled.div`
    display: 'flex';
    flex-direction: 'column';
    width: min-content;
    position: absolute;
    background-color: ${colors.white};
    box-shadow: ${styles.boxShadow.overlayElement};
    border-radius: ${styles.boxShadow.overlayElement};
    left: 105px;
    top: 30px;
    z-index: 1;
`

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver ||
        props.dropReceivingState?.wasPageDropped
            ? 'flex'
            : 'None'};
    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    padding-left: 5px;
    z-index: 1;
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
    padding-left: 15px;
    align-items: center;
    color: ${(props) => props.theme.colors.normalText};
`

const SidebarItem = styled.div<Props>`
 height: 40px;
margin: 0 10px;
border-radius: 5px;
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 align-items: center;
 background-color: ${(props) =>
     props.dropReceivingState?.isDraggedOver
         ? props.theme.colors.backgroundColorDarker
         : 'transparent'};

 &:hover {
    background-color: ${(props) => props.theme.colors.lightHover};
 }






 ${({ isMenuDisplayed, dropReceivingState }) =>
     css`
         background-color: ${isMenuDisplayed ||
         (dropReceivingState?.canReceiveDroppedItems &&
             dropReceivingState?.isDraggedOver)
             ? `${(props) => props.theme.colors.lightHover}`
             : `transparent`};
     `};



 &:hover ${IconBox} {

 display: ${(props) =>
     !props.dropReceivingState?.isDraggedOver ? 'flex' : 'None'};

 }



 &:hover ${TitleBox} {

 width: 70%;

 }



 ${({ selectedState }: Props) =>
     selectedState?.isSelected &&
     css`
         color: ${(props) => props.theme.colors.darkText};
     `}


 cursor: ${({ dropReceivingState }: Props) =>
     !dropReceivingState?.isDraggedOver
         ? `pointer`
         : dropReceivingState?.canReceiveDroppedItems
         ? `pointer`
         : `not-allowed`};

`

const MenuButton = styled.div`
    height: 34px;
    width: 100%;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px 0 0;
    & ${SidebarItem} {
        background-color: red;
    }
    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }
    & > div {
        width: auto;
    }
`

const ListTitle = styled.span<Props>`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: 400;
    font-style: normal;
    ${({ selectedState }: Props) =>
        selectedState.isSelected && `font-weight: 600;`}
    font-size:  14px;
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
    border: 1.5px solid ${(props) => props.theme.colors.iconColor};
`

const ActivityBeacon = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 20px;
    background-color: ${(props) => props.theme.colors.purple};
`

const NewItemsCount = styled.div`
    width: fit-content;
    min-width: 20px;
    height: 14px;
    border-radius: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background-color: ${(props) => props.theme.colors.purple};
    padding: 2px 8px;
    color: white;
    text-align: center;
    font-weight: 600;
    justify-content: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    padding: 2px 0px;
`

// probably want to use timing function to get this really looking good. This is just quick and dirty

const blinkingAnimation = keyframes`
 0% {
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
 }
 50% {
    background-color: transparent;
 }
 100% {
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
 }
`

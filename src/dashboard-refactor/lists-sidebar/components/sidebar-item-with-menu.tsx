import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'

import { Icon } from 'src/dashboard-refactor/styled-components'
import Margin from 'src/dashboard-refactor/components/Margin'
import {
    ListSource,
    DropReceivingState,
    SelectedState,
} from 'src/dashboard-refactor/types'
import { Props as EditableItemProps } from './sidebar-editable-item'
import { ListNameHighlightIndices } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props {
    className?: string
    isEditing?: boolean
    newItemsCount?: number
    name: string
    listId: number
    source?: ListSource
    hasActivity?: boolean
    isMenuDisplayed?: boolean
    isCollaborative?: boolean
    nameHighlightIndices?: ListNameHighlightIndices
    onUnfollowClick?: React.MouseEventHandler
    onRenameClick?: React.MouseEventHandler
    onDeleteClick?: React.MouseEventHandler
    onShareClick?: React.MouseEventHandler
    dropReceivingState?: DropReceivingState
    editableProps?: EditableItemProps
    selectedState: SelectedState
    onMoreActionClick?: (listId: number) => void
}

export default class ListsSidebarItemWithMenu extends PureComponent<Props> {
    private handleSelection: React.MouseEventHandler = (e) =>
        this.props.selectedState.onSelection(this.props.listId)

    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onMoreActionClick(this.props.listId)
    }

    private handleDragEnter: React.DragEventHandler = (e) => {
        e.preventDefault()
        // Needed to push this op back on the event queue, so it fires after the previous
        //  list item's `onDropLeave` event
        setTimeout(() => this.props.dropReceivingState?.onDragEnter(), 0)
    }

    private handleDrop: React.DragEventHandler = (e) => {
        e.preventDefault()
        if (!this.props.dropReceivingState?.canReceiveDroppedItems) {
            return
        }

        this.props.dropReceivingState?.onDrop(e.dataTransfer)
    }

    private renderMenuBtns() {
        if (!this.props.source) {
            return false
        }

        if (this.props.source === 'followed-lists') {
            return (
                <MenuButton onClick={this.props.onUnfollowClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={'TODO.svg'} />
                    </Margin>
                    Unfollow
                </MenuButton>
            )
        }

        return (
            <>
                <MenuButton onClick={this.props.onShareClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.link} />
                    </Margin>
                    Share
                </MenuButton>
                <MenuButton onClick={this.props.onDeleteClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.remove} />
                    </Margin>
                    Delete
                </MenuButton>
                <MenuButton onClick={this.props.onRenameClick}>
                    <Margin horizontal="10px">
                        <Icon heightAndWidth="12px" path={icons.edit} />
                    </Margin>
                    Rename
                </MenuButton>
            </>
        )
    }

    private renderIcon() {
        const {
            dropReceivingState,
            onMoreActionClick,
            newItemsCount,
            hasActivity,
        } = this.props

        if (hasActivity) {
            return <ActivityBeacon />
        }

        if (newItemsCount) {
            return (
                <NewItemsCount>
                    <NewItemsCountInnerDiv>
                        {newItemsCount}
                    </NewItemsCountInnerDiv>
                </NewItemsCount>
            )
        }

        if (
            dropReceivingState?.canReceiveDroppedItems &&
            dropReceivingState?.isDraggedOver
        ) {
            return <Icon heightAndWidth="12px" path={icons.plus} />
        }

        if (onMoreActionClick) {
            return <Icon heightAndWidth="12px" path={icons.dots} />
        }
    }

    private renderTitle() {
        const collaborationIcon = this.props.isCollaborative && (
            <Icon heightAndWidth="12px" path={icons.shared} />
        )

        if (!this.props.nameHighlightIndices) {
            return (
                <ListTitle selectedState={this.props.selectedState}>
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
                    {nameHighlighted}
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
                    dropReceivingState={dropReceivingState}
                    isMenuDisplayed={isMenuDisplayed}
                    selectedState={selectedState}
                    onDragLeave={dropReceivingState?.onDragLeave}
                    onDragEnter={this.handleDragEnter}
                    onDragOver={(e) => e.preventDefault()} // Needed to allow the `onDrop` event to fire
                    onDrop={this.handleDrop}
                    title={this.props.name}
                >
                    <TitleBox onClick={this.handleSelection}>
                        {' '}
                        {this.renderTitle()}
                    </TitleBox>
                    <IconBox
                        dropReceivingState={dropReceivingState}
                        newItemsCount={newItemsCount}
                        hasActivity={hasActivity}
                        onClick={this.handleMoreActionClick}
                    >
                        {this.renderIcon()}
                    </IconBox>
                </SidebarItem>
                <MenuContainer isDisplayed={isMenuDisplayed}>
                    {this.renderMenuBtns()}
                </MenuContainer>
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
`

const MenuContainer = styled.div`
    width: min-content;
    position: absolute;
    background-color: ${colors.white};
    box-shadow: ${styles.boxShadow.overlayElement};
    border-radius: ${styles.boxShadow.overlayElement};
    left: 105px;
    top: 30px;
    z-index: 1;

    ${(props) =>
        css`
            display: ${props.isDisplayed
                ? `flex; flex-direction: column`
                : `none`};
        `};
`

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.hasActivity ||
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver
            ? 'flex'
            : 'none'};
    height: 100%;
    align-items: center;
    justify-content: flex-end;
`

const TitleBox = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
    padding-left: 15px;
    align-items: center;
`

const SidebarItem = styled.div<Props>`
    height: 30px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
    padding-right: 10px;

    &:hover {
        background-color: ${colors.onHover};
    }

    ${({ isMenuDisplayed, dropReceivingState }) =>
        css`
            background-color: ${isMenuDisplayed ||
            (dropReceivingState?.canReceiveDroppedItems &&
                dropReceivingState?.isDraggedOver)
                ? `${colors.onHover}`
                : `transparent`};
        `};

    &:hover ${IconBox} {
        display: ${(props) =>
            !(
                props.hasActivity &&
                props.newItemsCount &&
                props.dropReceivingState?.isDraggedOver
            )
                ? 'flex'
                : 'none'};
    }

    &:hover ${TitleBox} {
        width: 90%;
    }

    ${({ selectedState }: Props) =>
        selectedState?.isSelected &&
        css`
            background-color: ${colors.onSelect};
        `}

    ${({ dropReceivingState }: Props) =>
        dropReceivingState?.triggerSuccessfulDropAnimation &&
        css`
            animation: ${blinkingAnimation} 0.4s 2;
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
    font-size: 12px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px 0 0;

    &: ${SidebarItem} {
        background-color: red;
    }

    &:hover {
        background-color: ${colors.onHover};
    }

    & > div {
        width: auto;
    }
`

const ListTitle = styled.span<Props>`
    display: flex;
    align-items: center;
    margin: 0;
    font-family: ${fonts.primary.name};
    font-style: normal;
    ${({ selectedState }: Props) =>
        selectedState.isSelected &&
        `font-weight: ${fonts.primary.weight.bold};`}
    font-size: 12px;
    line-height: 18px;
    height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 5px;
    justify-content: space-between;
    width: 100%;
`

const ActivityBeacon = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 10px;
    padding: 8px;
    background-color: #5cd9a6;
`

const NewItemsCount = styled.div`
    width: 30px;
    height: 14px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    font-size: 14px;
    line-height: 14px;
`

// probably want to use timing function to get this really looking good. This is just quick and dirty
const blinkingAnimation = keyframes`
    0% {
        background-color: ${colors.onHover};
    }
    70% {
        background-color: transparent;
    }
    100% {
        background-color: ${colors.onHover};
    }
`

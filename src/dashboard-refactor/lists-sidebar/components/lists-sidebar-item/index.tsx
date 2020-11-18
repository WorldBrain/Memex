import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { fonts } from 'src/dashboard-refactor/styleConstants'

import { NewItemsCountState } from 'src/dashboard-refactor/types'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styledComponents'

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

const containerWidth = 173
const titleLeftMargin = 19
const iconWidth = 12
const iconMargin = 7.5
const unHoveredWidth = containerWidth - titleLeftMargin - iconMargin

const Container = styled.div`
    height: 27px;
    width: ${containerWidth}px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
    ${(props) =>
        props.isHovered &&
        css`
            background-color: ${colors.onHover};
        `}
    ${(props) =>
        props.isHovered &&
        props.isSelected &&
        css`
            background-color: ${colors.onSelect};
        `}
    ${(props) =>
        props.isBlinking &&
        css`
            animation: ${blinkingAnimation} 0.4s 2;
        `}
    ${css`
        cursor: ${(props) =>
            !props.isDraggedOver
                ? `pointer`
                : props.isDroppable
                ? `default`
                : `not-allowed`};
    `}
    `

const ListTitle = styled.p`
    margin: 0;
    font-family: ${fonts.primary.name};
    font-style: normal;
    ${(props) =>
        props.isSelected &&
        css`
            font-weight: ${fonts.primary.weight.bold};
        `}
    font-size: 14px;
    line-height: 21px;
    height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${(props) =>
        css`
            width: ${props.isHovered
                ? unHoveredWidth - iconMargin - iconWidth
                : unHoveredWidth}px;
        `}
`

const NewItemsCount = styled.div`
    width: 30px;
    height: 14px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${colors.midGrey};
    div {
        font-family: ${fonts.primary.name};
        font-weight: ${fonts.primary.weight.bold};
        font-size: 10px;
        line-height: 14px;
    }
`

// this type is differentiated from the type which governs the object passed down the tree to its parent:
// the click handlers in this type have received their parameters from the parent and so receive none
export interface ListsSidebarItemComponentProps {
    className?: string
    listName: string
    isEditing: boolean
    hoverState: HoverState
    selectedState: SelectedState
    droppableState: DroppableState
    newItemsCountState: NewItemsCountState
    moreActionButtonState: MoreActionButtonState
}

interface HoverState {
    onHoverEnter(): void
    onHoverLeave(): void
    isHovered: boolean
}

interface SelectedState {
    onSelection(): void
    isSelected: boolean
}

interface DroppableState {
    onDragOver(): void
    onDragLeave(): void
    onDrop(): void
    isDraggedOver: boolean
    isDroppable: boolean
    isBlinking: boolean
}

interface MoreActionButtonState {
    onMoreActionClick(): void
    displayMoreActionButton
}

export default class ListsSidebarItem extends PureComponent<
    ListsSidebarItemComponentProps
> {
    private handleDragOver() {
        this.props.droppableState.onDragOver()
    }
    private handleDragLeave() {
        this.props.droppableState.onDragLeave()
    }
    private handleDrop() {
        this.props.droppableState.onDrop()
    }
    private handleHoverEnter() {
        this.props.hoverState.onHoverEnter()
    }
    private handleHoverLeave() {
        this.props.hoverState.onHoverLeave()
    }
    private handleItemSelect() {
        this.props.selectedState.onSelection()
    }
    private renderIcon() {
        const {
            droppableState: { isDroppable, isDraggedOver },
            hoverState: { isHovered },
            newItemsCountState: { displayNewItemsCount, newItemsCount },
            moreActionButtonState: {
                onMoreActionClick,
                displayMoreActionButton,
            },
        } = this.props
        if (displayNewItemsCount)
            return (
                <NewItemsCount>
                    <div>{newItemsCount}</div>
                </NewItemsCount>
            )
        if (isDroppable && isDraggedOver)
            return <Icon xy="12px" path="/img/plus.svg" />
        if (isHovered && displayMoreActionButton)
            return (
                <Icon
                    onClick={onMoreActionClick}
                    xy="12px"
                    path="/img/open.svg"
                />
            )
    }
    private renderDefault() {
        const {
            className,
            listName,
            hoverState: { isHovered },
            selectedState: { isSelected },
            droppableState: { isBlinking, isDraggedOver, isDroppable },
            newItemsCountState: { displayNewItemsCount },
        } = this.props
        return (
            <Container
                className={className}
                onClick={this.handleItemSelect}
                onMouseEnter={this.handleHoverEnter}
                onMouseLeave={this.handleHoverLeave}
                onDragOver={this.handleDragOver}
                onDragEnter={this.handleDragOver}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}
                isDroppable={isDroppable}
                isDraggedOver={isDraggedOver}
                isHovered={isHovered}
                isSelected={isSelected}
                isBlinking={isBlinking}
            >
                <Margin left="19px">
                    <ListTitle isHovered={isHovered} isSelected={isSelected}>
                        {listName}
                    </ListTitle>
                </Margin>
                {(isHovered || displayNewItemsCount) && (
                    <Margin right={`${iconMargin}px`}>
                        {this.renderIcon()}
                    </Margin>
                )}
            </Container>
        )
    }
    private renderEditing() {
        const {
            className,
            listName,
            selectedState: { isSelected },
        } = this.props
        return (
            <Container className={className} isSelected={isSelected}>
                <Margin left={`${titleLeftMargin}px`}>
                    <ListTitle>{listName}</ListTitle>
                </Margin>
            </Container>
        )
    }
    render() {
        if (this.props.isEditing) return this.renderEditing()
        return this.renderDefault()
    }
}

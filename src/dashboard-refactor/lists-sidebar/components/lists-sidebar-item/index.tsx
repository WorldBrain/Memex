import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'

import colors from '../../../colors'
import { fonts } from '../../../styles'

import { NewItemsCountState } from 'src/dashboard-refactor/types'

import Margin from 'src/dashboard-refactor/components/Margin'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { LodashIsBoolean } from 'lodash/fp'

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

interface ContainerProps {
    isHovered: boolean
    isSelected: boolean
    isBlinking: boolean
    isDraggedOver: boolean
    canReceiveDroppedItems: boolean
}

const Container = styled.div<ContainerProps>`
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
                : props.canReceiveDroppedItems
                ? `default`
                : `not-allowed`};
    `}
    `

interface ListTitleProps {
    isHovered: boolean
    isSelected: boolean
}

const ListTitle = styled.p<ListTitleProps>`
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
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    font-size: 10px;
    line-height: 14px;
`

// this type is differentiated from the type which governs the object passed down the tree to its parent:
// the click handlers in this type have received their parameters from the parent and so receive none
export interface ListsSidebarItemComponentProps {
    className?: string
    listName: string
    isEditing: boolean
    hoverState: HoverState
    selectedState: SelectedState
    dropReceivingState: DropReceivingState
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

export interface DropReceivingState {
    onDragOver(): void
    onDragLeave(): void
    onDrop(): void
    triggerSuccessfulDropAnimation: boolean
    isDraggedOver: boolean
    canReceiveDroppedItems: boolean
}

interface MoreActionButtonState {
    onMoreActionClick(): void
    displayMoreActionButton
}

export default class ListsSidebarItem extends PureComponent<
    ListsSidebarItemComponentProps
> {
    private renderIcon() {
        const {
            dropReceivingState: { canReceiveDroppedItems, isDraggedOver },
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
                    <NewItemsCountInnerDiv>
                        {newItemsCount}
                    </NewItemsCountInnerDiv>
                </NewItemsCount>
            )
        if (canReceiveDroppedItems && isDraggedOver)
            return <Icon heightAndWidth="12px" path="/img/plus.svg" />
        if (isHovered && displayMoreActionButton)
            return (
                <Icon
                    onClick={onMoreActionClick}
                    heightAndWidth="12px"
                    path="/img/open.svg"
                />
            )
    }
    private renderDefault() {
        const {
            className,
            listName,
            hoverState: { isHovered, onHoverEnter, onHoverLeave },
            selectedState: { isSelected, onSelection },
            dropReceivingState: {
                isDraggedOver,
                canReceiveDroppedItems,
                triggerSuccessfulDropAnimation,
                onDragOver,
                onDragLeave,
                onDrop,
            },
            newItemsCountState: { displayNewItemsCount },
        } = this.props
        return (
            <Container
                className={className}
                onClick={onSelection}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                isDroppable={canReceiveDroppedItems}
                isDraggedOver={isDraggedOver}
                isHovered={isHovered}
                isSelected={isSelected}
                isBlinking={triggerSuccessfulDropAnimation}
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

import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'

import colors from '../../../colors'
import { fonts } from '../../../styleConstants'

import {
    HoverState,
    DroppableState,
    SelectedState,
    NewItemsCountState,
} from 'src/dashboard-refactor/types'

import Margin from 'src/dashboard-refactor/components/Margin'

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

const Container = styled.div`
    height: 27px;
    width: 100%;
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
    `

const ListTitle = styled.div`
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
`

const Icon = styled.div`
    height: 12px;
    width: 12px;
    font-size: 12px;
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

interface ListsSidebarItemBaseProps {
    onMoreActionClick(): void
    listName: string
    isEditing: boolean
    selectedState: SelectedState
    hoverState: HoverState
    droppableState: DroppableState
    newItemsCountState: NewItemsCountState
}

export default class ListsSidebarItemBase extends PureComponent<
    ListsSidebarItemBaseProps
> {
    private renderIcon() {
        const {
            droppableState: { isDroppable, isDraggedOver },
            hoverState: { isHovered },
            newItemsCountState: { displayNewItemsCount, newItemsCount },
            onMoreActionClick,
        } = this.props
        if (displayNewItemsCount)
            return (
                <NewItemsCount>
                    <div>{newItemsCount}</div>
                </NewItemsCount>
            )
        if (isDroppable && isDraggedOver) return <Icon>+</Icon>
        if (isHovered) return <Icon onClick={onMoreActionClick}>M</Icon>
    }
    private renderDefault() {
        const {
            listName,
            hoverState: { onHoverEnter, onHoverLeave, isHovered },
            selectedState: { onSelection, isSelected },
            droppableState: { isBlinking, onDragOver, onDragLeave, onDrop },
            newItemsCountState: { displayNewItemsCount },
        } = this.props
        return (
            <Container
                onClick={onSelection}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                onDragOver={onDragOver}
                onDragEnter={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                isHovered={isHovered}
                isSelected={isSelected}
                isBlinking={isBlinking}
            >
                <Margin left="19px">
                    <ListTitle isSelected={isSelected}>{listName}</ListTitle>
                </Margin>
                {(isHovered || displayNewItemsCount) && (
                    <Margin right="7.5px">{this.renderIcon()}</Margin>
                )}
            </Container>
        )
    }
    private renderEditing() {
        const {
            listName,
            selectedState: { isSelected },
        } = this.props
        return (
            <Container isSelected={isSelected}>
                <Margin left="19px">
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

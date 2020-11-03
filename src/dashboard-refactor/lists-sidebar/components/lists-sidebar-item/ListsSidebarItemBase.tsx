import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from '../../../colors'
import { fonts } from '../../../styleConstants'

import {
    HoverState,
    ReceivesDraggableItemsState,
    SelectedState,
} from 'src/dashboard-refactor/types'

import Margin from 'src/dashboard-refactor/components/Margin'

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

const MoreIcon = styled.div`
    height: 12px;
    width: 12px;
    font-size: 12px;
`

interface ListsSidebarItemBaseProps {
    onMoreActionClick(): void
    listName: string
    isEditing: boolean
    selectedState: SelectedState
    hoverState: HoverState
    receivesDraggableItemsState: ReceivesDraggableItemsState
}

export default class ListsSidebarItemBase extends PureComponent<
    ListsSidebarItemBaseProps
> {
    private renderDefault() {
        const {
            onMoreActionClick,
            listName,
            hoverState: { onHoverEnter, onHoverLeave, isHovered },
            selectedState: { onSelection, isSelected },
            receivesDraggableItemsState: { onDragOver, onDragLeave, onDrop },
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
            >
                <Margin left="19px">
                    <ListTitle isSelected={isSelected}>{listName}</ListTitle>
                </Margin>
                <Margin right="7.5px">
                    <MoreIcon onClick={onMoreActionClick}>M</MoreIcon>
                </Margin>
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

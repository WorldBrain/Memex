import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarItem, {
    Props,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'
import { DropReceivingState } from 'src/dashboard-refactor/types'
import { ListNameHighlightIndices } from 'src/dashboard-refactor/lists-sidebar/types'

const dropReceivingState: DropReceivingState = {
    canReceiveDroppedItems: true, // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: false,
    triggerSuccessfulDropAnimation: false,
    onDragEnter: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
}

const hoverState = {
    onHoverEnter: () => {},
    onHoverLeave: () => {},
    isHovered: false,
}

const selectedState = {
    onSelection: () => {},
    isSelected: false,
}

const template: Props = {
    listId: -1,
    isEditing: false,
    name: 'Cool List Name',
    selectedState,
    dropReceivingState,
}

export const listsSidebarItemProps = {
    default: {
        ...template,
    },
    hovered: {
        ...template,
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
    selected: {
        ...template,
        selectedState: {
            ...selectedState,
            isSelected: true,
        },
    },
    hoveredAndSelected: {
        ...template,
        selectedState: {
            ...selectedState,
            isSelected: true,
        },
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
    isEditing: {
        ...template,
        isEditing: true,
        selectedState: {
            ...selectedState,
            isSelected: true,
        },
    },
    isDroppableAndDraggedOver: {
        ...template,
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
        dropReceivingState: {
            ...dropReceivingState,
            isDraggedOver: true,
        },
    },
    onDrop: {
        ...template,
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
        dropReceivingState: {
            ...dropReceivingState,
            triggerSuccessfulDropAnimation: true,
        },
    },
    displayNewItemsCount: {
        ...template,
        newItemsCount: Math.floor(Math.random() * 10),
    },
    longName: {
        ...template,
        listName: 'This is a very long collection name',
    },
    searchMatch: {
        ...template,
        listName: 'Astrophysics',
        nameHighlightIndices: [0, 5] as ListNameHighlightIndices,
    },
}

const stories = storiesOf(
    'Dashboard Refactor|Lists Sidebar/Item Variations',
    module,
)

stories.add('Default', () => (
    <ListsSidebarItem {...listsSidebarItemProps.default} />
))
stories.add('Hovered', () => (
    <ListsSidebarItem {...listsSidebarItemProps.hovered} />
))
stories.add('Selected', () => (
    <ListsSidebarItem {...listsSidebarItemProps.selected} />
))
stories.add('Hovered and Selected', () => (
    <ListsSidebarItem {...listsSidebarItemProps.hoveredAndSelected} />
))
stories.add('Editing', () => (
    <ListsSidebarItem {...listsSidebarItemProps.isEditing} />
))
stories.add('Droppable and Dragged Over', () => (
    <ListsSidebarItem {...listsSidebarItemProps.isDroppableAndDraggedOver} />
))
stories.add('On Drop', () => (
    <ListsSidebarItem {...listsSidebarItemProps.onDrop} />
))
stories.add('Display New Items Count', () => (
    <ListsSidebarItem {...listsSidebarItemProps.displayNewItemsCount} />
))
stories.add('Long List Name', () => (
    <ListsSidebarItem {...listsSidebarItemProps.longName} />
))
stories.add('Search Restul', () => (
    <ListsSidebarItem {...listsSidebarItemProps.searchMatch} />
))

export const listsSidebarItemWithMenuProps: Props = {
    name: 'test A',
    isMenuDisplayed: true,
    listId: 123,
    ...listsSidebarItemProps.hoveredAndSelected,
    onDeleteClick: () => {},
    onRenameClick: () => {},
    onShareClick: () => {},
}

export const listsSidebarItemWithShortMenuProps: Props = {
    name: 'test A',
    isMenuDisplayed: true,
    listId: 123,
    ...listsSidebarItemProps.hoveredAndSelected,
    onUnfollowClick: () => {},
}

stories.add('3x Item Menu Extended', () => (
    <ListsSidebarItem {...listsSidebarItemWithMenuProps} />
))

stories.add('1x Item Menu Extended', () => (
    <ListsSidebarItem {...listsSidebarItemWithShortMenuProps} />
))

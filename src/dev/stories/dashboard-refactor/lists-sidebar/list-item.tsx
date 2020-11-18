import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarItem from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item/'
import ListsSidebarItemWithMenu, {
    ListsSidebarItemWithMenuProps,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'

const newItemsCountState = {
    displayNewItemsCount: false,
    newItemsCount: 0,
}

const moreActionButtonState = {
    onMoreActionClick: () => {},
    displayMoreActionButton: true,
}

const droppableState = {
    isDroppable: true, // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: false,
    isBlinking: false,
    onDragOver: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
}

export const listsSidebarItemProps = {
    default: {
        isEditing: false,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: false,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: false,
        },
        droppableState,
        newItemsCountState,
    },
    hovered: {
        isEditing: false,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: false,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: true,
        },
        droppableState,
        newItemsCountState,
    },
    selected: {
        isEditing: false,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: true,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: false,
        },
        droppableState,
        newItemsCountState,
    },
    hoveredAndSelected: {
        isEditing: false,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: true,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: true,
        },
        droppableState,
        newItemsCountState,
    },
    isEditing: {
        isEditing: true,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: true,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: false,
        },
        droppableState,
        newItemsCountState,
    },
    isDroppableAndDraggedOver: {
        isEditing: false,
        moreActionButtonState,
        listName: `This is a very long collection name`,
        selectedState: {
            onSelection: () => {},
            isSelected: false,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: true,
        },
        droppableState: {
            ...droppableState,
            isDraggedOver: true,
        },
        newItemsCountState,
    },
    onDrop: {
        isEditing: false,
        moreActionButtonState,
        listName: `This is a very long collection name`,
        selectedState: {
            onSelection: () => {},
            isSelected: false,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: true,
        },
        droppableState: {
            ...droppableState,
            isBlinking: true,
        },
        newItemsCountState,
    },
    displayNewItemsCount: {
        isEditing: false,
        moreActionButtonState,
        listName: 'This is a very long collection name',
        selectedState: {
            onSelection: () => {},
            isSelected: false,
        },
        hoverState: {
            onHoverEnter: () => {},
            onHoverLeave: () => {},
            isHovered: false,
        },
        droppableState,
        newItemsCountState: {
            displayNewItemsCount: true,
            newItemsCount: Math.floor(Math.random() * 10),
        },
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

export const listsSidebarItemWithMenuProps: ListsSidebarItemWithMenuProps = {
    listId: 'https://www.blah.com/',
    isMenuDisplayed: true,
    listsSidebarItemProps: listsSidebarItemProps.hoveredAndSelected,
    listsSidebarItemActionsArray: [
        {
            label: 'Share',
            iconPath: '/img/share.svg',
            onClick: (normalizedPageUrl: string) => {},
        },
        {
            label: 'Delete',
            iconPath: '/img/trash.svg',
            onClick: (normalizedPageUrl: string) => {},
        },
        {
            label: 'Rename',
            iconPath: '/img/edit.svg',
            onClick: (normalizedPageUrl: string) => {},
        },
    ],
}

export const listsSidebarItemWithShortMenuProps: ListsSidebarItemWithMenuProps = {
    listId: 'https://www.blah.com/',
    isMenuDisplayed: true,
    listsSidebarItemProps: listsSidebarItemProps.hoveredAndSelected,
    listsSidebarItemActionsArray: [
        {
            label: 'Unfollow',
            iconPath: '/img/cross_circle.svg',
            onClick: (normalizedPageUrl: string) => {},
        },
    ],
}

stories.add('3x Item Menu Extended', () => (
    <ListsSidebarItemWithMenu {...listsSidebarItemWithMenuProps} />
))

stories.add('1x Item Menu Extended', () => (
    <ListsSidebarItemWithMenu {...listsSidebarItemWithShortMenuProps} />
))

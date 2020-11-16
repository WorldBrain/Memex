import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarItem from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item/'
import ListsSidebarItemWithMenu, {
    ListsSidebarItemWithMenuProps,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'
import {
    DropReceivingComponentState,
    ListsSidebarItemComponentProps,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item/types'

const newItemsCountState = {
    displayNewItemsCount: false,
    newItemsCount: 0,
}

const moreActionButtonState = {
    onMoreActionClick: () => {},
    displayMoreActionButton: true,
}

const dropReceivingState: DropReceivingComponentState = {
    canReceiveDroppedItems: true, // this defines whether items can be dropped (not whether there is a state change on drag-over)
    isDraggedOver: false,
    triggerSuccessfulDropAnimation: false,
    onDragOver: () => {},
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

const template: ListsSidebarItemComponentProps = {
    isEditing: false,
    listName: [
        {
            text: 'Cool List Name',
            match: false,
        },
    ],
    hoverState,
    selectedState,
    dropReceivingState,
    newItemsCountState,
    moreActionButtonState,
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
        newItemsCountState: {
            displayNewItemsCount: true,
            newItemsCount: Math.floor(Math.random() * 10),
        },
    },
    longName: {
        ...template,
        listName: [
            {
                text: 'This is a very long collection name',
                match: false,
            },
        ],
    },
    searchMatch: {
        ...template,
        listName: [
            {
                text: 'Astro',
                match: true,
            },
            {
                text: 'physics',
                match: false,
            },
        ],
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

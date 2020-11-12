import React from 'react'
import { storiesOf } from '@storybook/react'
import ListsSidebarItemBase from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item/'

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

const listsSidebarItemProps = {
    default: {
        isEditing: false,
        moreActionButtonState,
        listName: 'Cool stuff',
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
        listName: 'Other cool stuff',
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
        listName: 'Fast cars',
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
        listName: 'Existential philosophy',
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
        listName: 'Self-organising',
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
        listName: `Bit of a drag`,
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
        listName: `Drop it like it's hot`,
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
        listName: 'How high',
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
    <ListsSidebarItemBase {...listsSidebarItemProps.default} />
))
stories.add('Hovered', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.hovered} />
))
stories.add('Selected', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.selected} />
))
stories.add('Hovered and Selected', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.hoveredAndSelected} />
))
stories.add('Editing', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.isEditing} />
))
stories.add('Droppable and Dragged Over', () => (
    <ListsSidebarItemBase
        {...listsSidebarItemProps.isDroppableAndDraggedOver}
    />
))
stories.add('On Drop', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.onDrop} />
))
stories.add('Display New Items Count', () => (
    <ListsSidebarItemBase {...listsSidebarItemProps.displayNewItemsCount} />
))

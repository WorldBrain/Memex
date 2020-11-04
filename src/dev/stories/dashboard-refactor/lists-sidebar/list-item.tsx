import React from 'react'
import { storiesOf } from '@storybook/react'
import ListsSidebarItemBase from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item/ListsSidebarItemBase'

const newItemsCountState = {
    displayNewItemsCount: false,
    newItemsCount: 0,
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
        onMoreActionClick: function () {},
        listName: 'Let it be known that',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Existence',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Is',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Suffering',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Editable List Name',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Drop on me :)',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Drop on me :)',
        selectedState: {
            onSelection: function () {},
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
        onMoreActionClick: function () {},
        listName: 'Drop on me :)',
        selectedState: {
            onSelection: function () {},
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

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/ListItem', module)

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

import React from 'react'
import { storiesOf } from '@storybook/react'
import ListItemBase from 'src/dashboard-refactor/lists-sidebar/components/list-item/ListItemBase'

const listItemProps = {
    default: {
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
    },
    hovered: {
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
    },
    selected: {
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
    },
    hoveredAndSelected: {
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
    },
}

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/ListItem', module)

stories.add('Default', () => <ListItemBase {...listItemProps.default} />)
stories.add('Hovered', () => <ListItemBase {...listItemProps.hovered} />)
stories.add('Selected', () => <ListItemBase {...listItemProps.selected} />)
stories.add('Hovered and Selected', () => (
    <ListItemBase {...listItemProps.hoveredAndSelected} />
))

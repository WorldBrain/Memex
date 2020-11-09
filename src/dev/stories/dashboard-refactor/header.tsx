import React from 'react'
import { storiesOf } from '@storybook/react'

import SidebarToggle from '../../../dashboard-refactor/header/SidebarToggle'

const stories = storiesOf('Dashboard Refactor|Header/SidebarToggle', module)

const props = {
    noHover: {
        sidebarLockedState: {
            onSidebarToggleClick: function () {},
            isSidebarLocked: false,
        },
        hoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: false,
        },
    },
    unlockedHover: {
        sidebarLockedState: {
            onSidebarToggleClick: function () {},
            isSidebarLocked: false,
        },
        hoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: true,
        },
    },
    lockedHover: {
        sidebarLockedState: {
            onSidebarToggleClick: function () {},
            isSidebarLocked: true,
        },
        hoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: true,
        },
    },
}

stories.add('No hover', () => <SidebarToggle {...props.noHover} />)
stories.add('Unlocked hover', () => <SidebarToggle {...props.unlockedHover} />)
stories.add('Locked hover', () => <SidebarToggle {...props.lockedHover} />)

import React from 'react'
import { storiesOf } from '@storybook/react'

import SidebarToggle from 'src/dashboard-refactor/header/SidebarHeader/SidebarToggle/SidebarToggle'

const stories = storiesOf('Dashboard Refactor|Header/Sidebar Toggle', module)

export const sidebarToggleProps = {
    noHover: {
        sidebarLockedState: {
            toggleSidebarLockedState: function () {},
            isSidebarLocked: false,
        },
        sidebarToggleHoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: false,
        },
    },
    unlockedHover: {
        sidebarLockedState: {
            toggleSidebarLockedState: function () {},
            isSidebarLocked: false,
        },
        sidebarToggleHoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: true,
        },
    },
    lockedHover: {
        sidebarLockedState: {
            toggleSidebarLockedState: function () {},
            isSidebarLocked: true,
        },
        sidebarToggleHoverState: {
            onHoverEnter: function () {},
            onHoverLeave: function () {},
            isHovered: true,
        },
    },
}

stories.add('No hover', () => <SidebarToggle {...sidebarToggleProps.noHover} />)
stories.add('Unlocked hover', () => (
    <SidebarToggle {...sidebarToggleProps.unlockedHover} />
))
stories.add('Locked hover', () => (
    <SidebarToggle {...sidebarToggleProps.lockedHover} />
))

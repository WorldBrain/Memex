import React from 'react'
import { storiesOf } from '@storybook/react'

import SidebarHeader from 'src/dashboard-refactor/header/SidebarHeader/SidebarHeader'
import SidebarToggle from 'src/dashboard-refactor/header/SidebarHeader/SidebarToggle/SidebarToggle'

const stories = storiesOf('Dashboard Refactor|Header', module)

const sidebarToggleProps = {
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

stories.add('Sidebar Toggle/No hover', () => (
    <SidebarToggle {...sidebarToggleProps.noHover} />
))
stories.add('Sidebar Toggle/Unlocked hover', () => (
    <SidebarToggle {...sidebarToggleProps.unlockedHover} />
))
stories.add('Sidebar Toggle/Locked hover', () => (
    <SidebarToggle {...sidebarToggleProps.lockedHover} />
))

const collectionsHeaderProps = {
    open: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        selectedCollectionHeader: 'Inbox',
        ...sidebarToggleProps.lockedHover,
    },
    closed: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        ...sidebarToggleProps.unlockedHover,
    },
}

stories.add('Sidebar Header/Open', () => (
    <SidebarHeader {...collectionsHeaderProps.open} />
))
stories.add('Sidebar Header/Closed', () => (
    <SidebarHeader {...collectionsHeaderProps.closed} />
))

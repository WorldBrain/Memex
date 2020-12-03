import React from 'react'
import { storiesOf } from '@storybook/react'

import { sidebarToggleProps } from './sidebar-toggle'

import SidebarHeader from 'src/dashboard-refactor/header/sidebar-header/'

const stories = storiesOf('Dashboard Refactor|Header/Sidebar Header', module)

const { lockedHover, noHover } = sidebarToggleProps
const sidebarTogglePropsRenamed = {
    lockedHover: {
        sidebarToggleHoverState: lockedHover.hoverState,
        ...lockedHover,
    },
    noHover: {
        sidebarToggleHoverState: noHover.hoverState,
        ...noHover,
    },
}

const collectionsHeaderProps = {
    open: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        selectedCollectionHeader: 'Inbox',
        ...sidebarTogglePropsRenamed.lockedHover,
    },
    closed: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        ...sidebarTogglePropsRenamed.noHover,
    },
}

stories.add('Sidebar Header/Open', () => (
    <SidebarHeader {...collectionsHeaderProps.open} />
))
stories.add('Sidebar Header/Closed', () => (
    <SidebarHeader {...collectionsHeaderProps.closed} />
))

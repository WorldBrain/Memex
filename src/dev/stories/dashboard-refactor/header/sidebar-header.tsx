import React from 'react'
import { storiesOf } from '@storybook/react'

import { sidebarToggleProps } from './sidebar-toggle'

import SidebarHeader, {
    SidebarHeaderProps,
} from 'src/dashboard-refactor/header/sidebar-header/'

const stories = storiesOf('Dashboard Refactor|Header/Sidebar Header', module)

const { lockedHover, noHover } = sidebarToggleProps
const sidebarTogglePropsRenamed = {
    lockedHover: {
        ...lockedHover,
        sidebarToggleHoverState: lockedHover.hoverState,
    },
    noHover: {
        ...noHover,
        sidebarToggleHoverState: noHover.hoverState,
    },
}

export const sidebarHeaderPropsTemplate: {
    open: SidebarHeaderProps
    closed: SidebarHeaderProps
    closedSelected: SidebarHeaderProps
} = {
    open: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        selectedListName: 'Inbox',
        ...sidebarTogglePropsRenamed.lockedHover,
    },
    closed: {
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        ...sidebarTogglePropsRenamed.noHover,
    },
    closedSelected: {
        ...sidebarTogglePropsRenamed.noHover,
        sidebarPeekState: {
            toggleSidebarPeekState: function () {},
            isSidebarPeeking: false,
        },
        selectedListName: 'Inbox',
    },
}

stories.add('Sidebar Header/Open', () => (
    <SidebarHeader {...sidebarHeaderPropsTemplate.open} />
))
stories.add('Sidebar Header/Closed', () => (
    <SidebarHeader {...sidebarHeaderPropsTemplate.closed} />
))
stories.add('Sidebar Header/Closed with Inbox selected', () => (
    <SidebarHeader {...sidebarHeaderPropsTemplate.closedSelected} />
))

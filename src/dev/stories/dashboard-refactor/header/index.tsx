import React from 'react'
import { storiesOf } from '@storybook/react'
import Header, { HeaderProps } from 'src/dashboard-refactor/header'
import { headerSearchBarPropsTemplate } from './search-bar'
import { syncStatusMenuStoryProps } from './sync-status-menu'
import { sidebarToggleProps } from './sidebar-toggle'

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

type SidebarHeaderProps = Pick<
    HeaderProps,
    'sidebarLockedState' | 'sidebarToggleHoverState' | 'selectedListName'
>

export const sidebarHeaderPropsTemplate: {
    open: SidebarHeaderProps
    closed: SidebarHeaderProps
    closedSelected: SidebarHeaderProps
} = {
    open: {
        selectedListName: 'Inbox',
        ...sidebarTogglePropsRenamed.lockedHover,
    },
    closed: {
        ...sidebarTogglePropsRenamed.noHover,
    },
    closedSelected: {
        ...sidebarTogglePropsRenamed.noHover,
        selectedListName: 'Inbox',
    },
}

const template: HeaderProps = {
    ...sidebarHeaderPropsTemplate.open,
    searchBarProps: headerSearchBarPropsTemplate.default,
    syncStatusMenuProps: syncStatusMenuStoryProps.hidden,
    syncStatusIconState: 'green',
}

const props: {
    default: HeaderProps
    sidebarToggled: HeaderProps
    searchBarWithInput: HeaderProps
    syncStatusIconYellow: HeaderProps
    syncStatusIconRed: HeaderProps
    syncStatusMenuOpen: HeaderProps
} = {
    default: template,
    sidebarToggled: {
        ...template,
        ...sidebarHeaderPropsTemplate.closed,
    },
    searchBarWithInput: {
        ...template,
        ...headerSearchBarPropsTemplate.withInput,
    },
    syncStatusIconYellow: {
        ...template,
        syncStatusIconState: 'yellow',
    },
    syncStatusIconRed: {
        ...template,
        syncStatusIconState: 'red',
    },
    syncStatusMenuOpen: {
        ...template,
        syncStatusMenuProps: syncStatusMenuStoryProps.allSuccessful,
    },
}

const stories = storiesOf('Dashboard Refactor|Header/Header Bar', module)

stories.add('Default', () => <Header {...props.default} />)
stories.add('Sidebar Toggled', () => <Header {...props.sidebarToggled} />)
stories.add('Search Query Populated', () => (
    <Header {...props.searchBarWithInput} />
))
stories.add('Sync Status Warning', () => (
    <Header {...props.syncStatusIconYellow} />
))
stories.add('Sync Status Error', () => <Header {...props.syncStatusIconRed} />)
stories.add('Sync Status Menu Open', () => (
    <Header {...props.syncStatusMenuOpen} />
))

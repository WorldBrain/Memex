import React from 'react'
import { storiesOf } from '@storybook/react'
import Header, { HeaderProps } from 'src/dashboard-refactor/header'
import { sidebarHeaderPropsTemplate } from './sidebar-header'
import { headerSearchBarPropsTemplate } from './search-bar'
import { syncStatusMenuStoryProps } from './sync-status-menu'

const template: HeaderProps = {
    sidebarHeaderProps: sidebarHeaderPropsTemplate.open,
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
        sidebarHeaderProps: {
            ...sidebarHeaderPropsTemplate.closed,
        },
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

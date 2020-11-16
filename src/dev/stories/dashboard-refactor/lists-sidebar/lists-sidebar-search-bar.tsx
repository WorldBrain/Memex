import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from '../../../../dashboard-refactor/lists-sidebar/components/lists-search-bar/'

import { sidebarWrapperFunc } from './lists-sidebar-group'

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/Search Bar', module)

const template: ListsSidebarSearchBarProps = {
    isSearchBarFocused: false,
    hasPerfectMatch: false,
    searchQuery: '',
    onListsSidebarSearchBarFocus: () => {},
    onListsSidebarSearchBarInputChange: () => {},
    onListsSidebarSearchBarInputClear: () => {},
}

const listsSidebarSearchBarProps: {
    default: ListsSidebarSearchBarProps
    withPerfectMatch: ListsSidebarSearchBarProps
    focused: ListsSidebarSearchBarProps
    withInputFocused: ListsSidebarSearchBarProps
    withInputUnfocused: ListsSidebarSearchBarProps
} = {
    default: template,
    focused: {
        ...template,
        isSearchBarFocused: true,
    },
    withPerfectMatch: {
        ...template,
        hasPerfectMatch: true,
    },
    withInputFocused: {
        ...template,
        isSearchBarFocused: true,
        searchQuery: 'Cat',
    },
    withInputUnfocused: {
        ...template,
        isSearchBarFocused: false,
        searchQuery: 'Gifs',
    },
}

stories.add(
    'Default State',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar {...listsSidebarSearchBarProps.default} />
    )),
)
stories.add(
    'Perfect Match',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar
            {...listsSidebarSearchBarProps.withPerfectMatch}
        />
    )),
)
stories.add(
    'Focused State',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar {...listsSidebarSearchBarProps.focused} />
    )),
)
stories.add(
    'With Input',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar
            {...listsSidebarSearchBarProps.withInputFocused}
        />
    )),
)
stories.add(
    'With Input',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar
            {...listsSidebarSearchBarProps.withInputUnfocused}
        />
    )),
)

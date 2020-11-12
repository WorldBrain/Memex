import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from '../../../../dashboard-refactor/lists-sidebar/components/lists-search-bar/'

import { sidebarWrapperFunc } from './lists-sidebar-group'

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/Search Bar', module)

const template: ListsSidebarSearchBarProps = {
    isSearchBarFocused: false,
    searchQuery: '',
    onListsSidebarSearchBarFocus: () => {},
    onListsSidebarSearchBarInputChange: () => {},
    onListsSidebarSearchBarSubmit: () => {},
}

const listsSidebarSearchBarProps: {
    default: ListsSidebarSearchBarProps
    focused: ListsSidebarSearchBarProps
    withInput: ListsSidebarSearchBarProps
} = {
    default: template,
    focused: {
        ...template,
        isSearchBarFocused: true,
    },
    withInput: {
        ...template,
        isSearchBarFocused: true,
        searchQuery: 'Cat',
    },
}

stories.add(
    'Default State',
    sidebarWrapperFunc(() => (
        <ListsSidebarSearchBar {...listsSidebarSearchBarProps.default} />
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
        <ListsSidebarSearchBar {...listsSidebarSearchBarProps.withInput} />
    )),
)

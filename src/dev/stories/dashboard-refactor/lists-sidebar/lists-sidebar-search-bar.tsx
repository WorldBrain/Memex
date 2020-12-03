import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from '../../../../dashboard-refactor/lists-sidebar/components/lists-search-bar/'

import { sidebarWrapperFunc } from './lists-sidebar-group'
import { SidebarLockedState } from 'src/dashboard-refactor/lists-sidebar/types'

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/Search Bar', module)

const sidebarLockedState: SidebarLockedState = {
    isSidebarLocked: true,
    toggleSidebarLockedState: () => {},
}

const template: ListsSidebarSearchBarProps = {
    isSearchBarFocused: false,
    hasPerfectMatch: false,
    searchQuery: '',
    onFocus: () => {},
    onSearchQueryChange: (inputString) => console.log(inputString),
    onInputClear: () => {},
    onCreateNew: (newListName) => console.log(newListName),
    sidebarLockedState: sidebarLockedState,
}

export const listsSidebarSearchBarProps: {
    default: ListsSidebarSearchBarProps
    defaultPeeking: ListsSidebarSearchBarProps
    withPerfectMatch: ListsSidebarSearchBarProps
    focused: ListsSidebarSearchBarProps
    withInputFocused: ListsSidebarSearchBarProps
    withInputUnfocused: ListsSidebarSearchBarProps
} = {
    default: template,
    defaultPeeking: {
        ...template,
        sidebarLockedState: {
            ...sidebarLockedState,
            isSidebarLocked: false,
        },
    },
    focused: {
        ...template,
        isSearchBarFocused: true,
    },
    withPerfectMatch: {
        ...template,
        hasPerfectMatch: true,
        searchQuery: 'Grumpy Cats',
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

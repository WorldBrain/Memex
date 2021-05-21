import React from 'react'
import { storiesOf } from '@storybook/react'

import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from '../../../../dashboard-refactor/lists-sidebar/components/search-bar'

import { sidebarWrapperFunc } from './lists-sidebar-group'
import { SidebarLockedState } from 'src/dashboard-refactor/lists-sidebar/types'

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/Search Bar', module)

const sidebarLockedState: SidebarLockedState = {
    isSidebarLocked: true,
    toggleSidebarLockedState: () => {},
}

const template: ListsSidebarSearchBarProps = {
    hasPerfectMatch: false,
    searchQuery: '',
    onSearchQueryChange: (inputString) => console.log(inputString),
    onInputClear: () => {},
    onCreateNew: (newListName) => console.log(newListName),
    sidebarLockedState,
}

export const listsSidebarSearchBarProps: {
    default: ListsSidebarSearchBarProps
    defaultPeeking: ListsSidebarSearchBarProps
    withPerfectMatch: ListsSidebarSearchBarProps
} = {
    default: template,
    defaultPeeking: {
        ...template,
        sidebarLockedState: {
            ...sidebarLockedState,
            isSidebarLocked: false,
        },
    },
    withPerfectMatch: {
        ...template,
        hasPerfectMatch: true,
        searchQuery: 'Grumpy Cats',
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

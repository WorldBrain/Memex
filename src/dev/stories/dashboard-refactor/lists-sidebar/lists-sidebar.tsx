import React from 'react'
import { storiesOf } from '@storybook/react'

import {
    ListsSidebarProps,
    SidebarLockedState,
    SidebarPeekState,
} from 'src/dashboard-refactor/lists-sidebar/types'
import { listsSidebarSearchBarProps } from './lists-sidebar-search-bar'
import { listsSidebarGroupProps } from './lists-sidebar-group'
import ListsSidebar from 'src/dashboard-refactor/lists-sidebar'

const stories = storiesOf('Dashboard Refactor|Lists Sidebar/Sidebar', module)

const lockedState: SidebarLockedState = {
    isSidebarLocked: false,
    toggleSidebarLockedState: () => {},
}

const peekState: SidebarPeekState = {
    isSidebarPeeking: false,
    toggleSidebarPeekState: () => {},
}

const template: ListsSidebarProps = {
    lockedState: lockedState,
    peekState: peekState,
    searchBarProps: {
        ...listsSidebarSearchBarProps.default,
        sidebarLockedState: lockedState,
    },
    listsGroups: [
        listsSidebarGroupProps.inboxes,
        listsSidebarGroupProps.myCollectionsExpanded,
        listsSidebarGroupProps.followedCollectionsExpanded,
    ],
}

export const listsSidebarStoryProps: {
    hidden: ListsSidebarProps
    peeking: ListsSidebarProps
    locked: ListsSidebarProps
} = {
    hidden: template,
    peeking: {
        ...template,
        peekState: {
            ...peekState,
            isSidebarPeeking: true,
        },
    },
    locked: {
        ...template,
        lockedState: {
            ...lockedState,
            isSidebarLocked: true,
        },
        searchBarProps: {
            ...listsSidebarSearchBarProps.default,
            sidebarLockedState: {
                ...template.searchBarProps.sidebarLockedState,
                isSidebarLocked: true,
            },
        },
    },
}

stories.add('Hidden', () => <ListsSidebar {...listsSidebarStoryProps.hidden} />)
stories.add('Peeking', () => (
    <ListsSidebar {...listsSidebarStoryProps.peeking} />
))
stories.add('locked', () => <ListsSidebar {...listsSidebarStoryProps.locked} />)

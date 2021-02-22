import React from 'react'
import { storiesOf } from '@storybook/react'
import styled from 'styled-components'

import ListsSidebarGroup, {
    ListsSidebarGroupProps,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-group'

import {
    listsSidebarItemProps,
    listsSidebarItemWithMenuProps,
    listsSidebarItemWithShortMenuProps,
} from './list-item'
import { TaskState } from 'ui-logic-core/lib/types'
import { Props } from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'

export const sidebarWrapperFunc = (ChildComponent) => {
    const Wrapper = styled.div`
        height: min-content;
        width: 193px;
        background-color: #e1e1e1;
        padding: 10px;
    `
    return () => {
        return (
            <Wrapper>
                <ChildComponent />
            </Wrapper>
        )
    }
}

const stories = storiesOf(
    'Dashboard Refactor|Lists Sidebar/Lists Group',
    module,
)

const taskState: TaskState = 'success'

const listsSidebarItemWithMenuPropsHidden: Props = {
    ...listsSidebarItemWithMenuProps,
    isMenuDisplayed: false,
}

const listsArray: Array<Props> = [
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.default,
        name: 'Cool List',
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.default,
        name: 'Cooler List',
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.default,
        name: 'Crazy List',
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.default,
        name: 'Intruiging List',
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.default,
        name: 'Sexy List',
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        ...listsSidebarItemProps.hovered,
        name: 'cat gifs',
    },
]

const listsSidebarGroupPropsTemplate: ListsSidebarGroupProps = {
    title: 'My Collections',
    loadingState: taskState,
    isExpanded: false,
    listsArray: [],
}

const inboxItemsProps = (name: string, isSelected = false): Props => {
    return {
        name,
        listId: name.length,
        ...listsSidebarItemProps.displayNewItemsCount,
        selectedState: {
            ...listsSidebarItemProps.displayNewItemsCount.selectedState,
            isSelected,
        },
    }
}

export const listsSidebarGroupProps: {
    errorState: ListsSidebarGroupProps
    loadingState: ListsSidebarGroupProps
    inboxes: ListsSidebarGroupProps
    myCollectionsExpanded: ListsSidebarGroupProps
    myCollectionsCollapsed: ListsSidebarGroupProps
    followedCollectionsExpanded: ListsSidebarGroupProps
} = {
    errorState: {
        ...listsSidebarGroupPropsTemplate,
        loadingState: 'error',
    },
    loadingState: {
        ...listsSidebarGroupPropsTemplate,
        loadingState: 'running',
    },
    inboxes: {
        ...listsSidebarGroupPropsTemplate,
        listsArray: [
            inboxItemsProps('All Saved'),
            inboxItemsProps('Inbox', true),
            inboxItemsProps('Saved From Mobile'),
        ],
        onExpandBtnClick: () => null,
        onAddBtnClick: () => null,
        loadingState: listsSidebarGroupPropsTemplate.loadingState,
    },
    myCollectionsExpanded: {
        ...listsSidebarGroupPropsTemplate,
    },
    myCollectionsCollapsed: {
        ...listsSidebarGroupPropsTemplate,
        isExpanded: false,
    },
    followedCollectionsExpanded: {
        ...listsSidebarGroupPropsTemplate,
        title: 'Followed Collections',
        listsArray: [
            ...listsArray.slice(0, listsArray.length - 2),
            {
                ...listsArray[5],
                ...listsSidebarItemWithShortMenuProps,
            },
        ],
    },
}

stories.add(
    'Error',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.errorState} />
    )),
)
stories.add(
    'Loading',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.loadingState} />
    )),
)
stories.add(
    'Inboxes',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.inboxes} />
    )),
)
stories.add(
    'My Collections Expanded',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.myCollectionsExpanded} />
    )),
)
stories.add(
    'My Collections Collapsed',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.myCollectionsCollapsed} />
    )),
)
stories.add(
    'Followed Collections',
    sidebarWrapperFunc(() => (
        <ListsSidebarGroup
            {...listsSidebarGroupProps.followedCollectionsExpanded}
        />
    )),
)

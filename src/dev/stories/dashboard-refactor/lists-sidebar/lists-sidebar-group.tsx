import React from 'react'
import { storiesOf } from '@storybook/react'
import styled from 'styled-components'

import ListsSidebarGroup, {
    ListsSidebarGroupProps,
    ListsSidebarItemsArrayObject,
} from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-group'

import {
    listsSidebarItemProps,
    listsSidebarItemWithMenuProps,
    listsSidebarItemWithShortMenuProps,
} from './list-item'
import { TaskState } from 'ui-logic-core/lib/types'
import { ListsSidebarItemWithMenuProps } from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'

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

const listsSidebarItemWithMenuPropsHidden: ListsSidebarItemWithMenuProps = {
    ...listsSidebarItemWithMenuProps,
    isMenuDisplayed: false,
}

const listsArray: Array<ListsSidebarItemWithMenuProps> = [
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.default,
            listName: 'Cool List',
        },
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.default,
            listName: 'Cooler List',
        },
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.default,
            listName: 'Crazy List',
        },
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.default,
            listName: 'Intruiging List',
        },
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.default,
            listName: 'Sexy List',
        },
    },
    {
        ...listsSidebarItemWithMenuPropsHidden,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.hovered,
            listName: 'cat gifs',
        },
    },
]

const listsSidebarGroupPropsTemplate: ListsSidebarGroupProps = {
    title: 'My Collections',
    loadingState: taskState,
    isExpanded: false,
    listsArray: [],
}

const inboxItemsProps = (
    name: string,
    isSelected = false,
): ListsSidebarItemWithMenuProps => {
    return {
        name,
        listId: `https://www.${name}.com/`,
        listsSidebarItemProps: {
            ...listsSidebarItemProps.displayNewItemsCount,
            selectedState: {
                ...listsSidebarItemProps.displayNewItemsCount.selectedState,
                isSelected,
            },
            listName: name,
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

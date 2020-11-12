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
import { AddableState, ExpandableState } from 'src/dashboard-refactor/types'
import { TaskState } from 'ui-logic-core/lib/types'
import { ListsSidebarItemWithMenuProps } from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-item-with-menu'

const wrapperFunc = (ChildComponent) => {
    const Wrapper = styled.div`
        height: min-content;
        width: 173px;
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

const addableState: AddableState = {
    isAddable: true,
    onAdd: () => {},
}

const expandableState: ExpandableState = {
    isExpandable: true,
    isExpanded: true,
    onExpand: () => {},
}

const taskState: TaskState = 'success'

const listsSidebarItemWithMenuPropsHidden: ListsSidebarItemWithMenuProps = {
    ...listsSidebarItemWithMenuProps,
    isMenuDisplayed: false,
}

const listsArray: Array<ListsSidebarItemsArrayObject> = [
    {
        listId: '1',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.default,
                listName: 'Cool List',
            },
        },
    },
    {
        listId: '2',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.default,
                listName: 'Cooler List',
            },
        },
    },
    {
        listId: '3',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.default,
                listName: 'Crazy List',
            },
        },
    },
    {
        listId: '4',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.default,
                listName: 'Intruiging List',
            },
        },
    },
    {
        listId: '6',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.default,
                listName: 'Sexy List',
            },
        },
    },
    {
        listId: '7',
        listsSidebarItemWithMenuProps: {
            ...listsSidebarItemWithMenuPropsHidden,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.hovered,
                listName: 'cat gifs',
            },
        },
    },
]

const listsSidebarGroupPropsTemplate: ListsSidebarGroupProps = {
    hasTitle: true,
    listsGroupTitle: 'My Collections',
    listSource: 'local-lists',
    listsArray,
    addableState,
    expandableState,
    taskState,
}

const inboxItemsProps = (name: string, isSelected?: boolean) => {
    if (!isSelected) isSelected = false
    return {
        listId: `https://www.${name}.com/`,
        listsSidebarItemWithMenuProps: {
            listId: `https://www.${name}.com/`,
            listsSidebarItemProps: {
                ...listsSidebarItemProps.displayNewItemsCount,
                selectedState: {
                    ...listsSidebarItemProps.displayNewItemsCount.selectedState,
                    isSelected: isSelected,
                },
                listName: name,
            },
        },
    }
}

// const inboxItemPropsTemplate = {
//     isEditing: false,
//     moreActionButtonState: {
//         displayMoreActionButton: true,
//         onMoreActionClick: () => {},
//     },
//     listName: 'AllSaved',
//     selectedState: {
//         isSelected: false,
//         onSelection: () => {},
//     },
//     hoverState: {
//         isHovered: false,
//         onHoverEnter: () => {},
//         onHoverLeave: () => {},
//     },
//     droppableState: {
//         onDragOver: () => {},
//         onDragLeave: () => {},
//         onDrop: () => {},
//         isDroppable: true,
//         isDraggedOver: false,
//         isBlinking: false,
//     },
//     newItemsCountState: {
//         displayNewItemsCount: true,
//         newItemsCount: 4,
//     },
// }

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
        taskState: 'error',
    },
    loadingState: {
        ...listsSidebarGroupPropsTemplate,
        taskState: 'running',
    },
    inboxes: {
        ...listsSidebarGroupPropsTemplate,
        listsArray: [
            inboxItemsProps('All Saved'),
            inboxItemsProps('Inbox', true),
            inboxItemsProps('Saved From Mobile'),
            // {
            //     listId: 'https://www.AllSaved.com/',
            //     listsSidebarItemWithMenuProps: {
            //         listId: 'https://www.AllSaved.com/',
            //         isMenuDisplayed: false,
            //         listsSidebarItemProps: {
            //             ...inboxItemPropsTemplate,
            //             listName: 'All Saved',
            //         },
            //     },
            // },
            // {
            //     listId: 'https://www.Inbox.com/',
            //     listsSidebarItemWithMenuProps: {
            //         listId: 'https://www.Inbox.com/',
            //         isMenuDisplayed: false,
            //         listsSidebarItemProps: {
            //             ...inboxItemPropsTemplate,
            //             listName: 'Inbox',
            //             selectedState: {
            //                 ...inboxItemPropsTemplate.selectedState,
            //                 isSelected: true,
            //             },
            //         },
            //     },
            // },
            // {
            //     listId: 'https://www.saved-from-mobile.com/',
            //     listsSidebarItemWithMenuProps: {
            //         listId: 'https://www.saved-from-mobile.com/',
            //         isMenuDisplayed: false,
            //         listsSidebarItemProps: {
            //             ...inboxItemPropsTemplate,
            //             listName: 'Saved From Mobile',
            //         },
            //     },
            // },
        ],
        addableState: listsSidebarGroupPropsTemplate.addableState,
        expandableState: listsSidebarGroupPropsTemplate.expandableState,
        taskState: listsSidebarGroupPropsTemplate.taskState,
        hasTitle: false,
    },
    myCollectionsExpanded: {
        ...listsSidebarGroupPropsTemplate,
    },
    myCollectionsCollapsed: {
        ...listsSidebarGroupPropsTemplate,
        expandableState: {
            ...expandableState,
            isExpanded: false,
        },
    },
    followedCollectionsExpanded: {
        ...listsSidebarGroupPropsTemplate,
        listsGroupTitle: 'Followed Collections',
        listSource: 'followed-list',
        listsArray: [
            ...listsArray.slice(0, listsArray.length - 2),
            {
                ...listsArray[5],
                listsSidebarItemWithMenuProps: {
                    ...listsSidebarItemWithShortMenuProps,
                },
            },
        ],
    },
}

stories.add(
    'Error',
    wrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.errorState} />
    )),
)
stories.add(
    'Loading',
    wrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.loadingState} />
    )),
)
stories.add(
    'Inboxes',
    wrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.inboxes} />
    )),
)
stories.add(
    'My Collections Expanded',
    wrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.myCollectionsExpanded} />
    )),
)
stories.add(
    'My Collections Collapsed',
    wrapperFunc(() => (
        <ListsSidebarGroup {...listsSidebarGroupProps.myCollectionsCollapsed} />
    )),
)
stories.add(
    'Followed Collections',
    wrapperFunc(() => (
        <ListsSidebarGroup
            {...listsSidebarGroupProps.followedCollectionsExpanded}
        />
    )),
)

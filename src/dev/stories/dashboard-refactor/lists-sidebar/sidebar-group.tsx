import React from 'react'
import { storiesOf } from '@storybook/react'

import { ListsSidebarGroupProps } from 'src/dashboard-refactor/lists-sidebar/components/lists-sidebar-group'

import { listsSidebarItemWithMenuProps } from './list-item'
import { AddableState, ExpandableState } from 'src/dashboard-refactor/types'
import { TaskState } from 'ui-logic-core/lib/types'

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

const taskState: TaskState = 'pristine'

const listsSidebarGroupProps: {
    myCollectionsDefault: ListsSidebarGroupProps
} = {
    myCollectionsDefault: {
        hasTitle: true,
        listsGroupTitle: 'My Collections',
        addableState,
        expandableState,
        taskState,
        listsSidebarItemWithMenuProps,
    },
}

stories.add('My Collections/Expanded')

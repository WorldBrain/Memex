import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { DropReceivingState } from 'src/dashboard-refactor/types'
import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'

export interface ListTreeState {
    unifiedId: UnifiedList['unifiedId']
    hasChildren: boolean
    areChildrenShown: boolean
    isNewChildInputShown: boolean
    newChildListCreateState: TaskState
}

export interface ListTreeActions {
    toggleShowChildren: () => void
    toggleShowNewChildInput: () => void
    createChildList: (name: string) => void
}

export interface Dependencies {
    /** Order is delegated to called - pass down already sorted. */
    lists: UnifiedList[]
    draggedListId: string | null
    areListsBeingFiltered: boolean
    onConfirmChildListCreate: (parentListId: string, name: string) => void
    initDropReceivingState: (
        listId: string,
    ) => Omit<DropReceivingState, 'wasPageDropped'>

    // New stuff
    renderListItem: (
        list: UnifiedList,
        treeState: ListTreeState,
        actions: ListTreeActions,
    ) => JSX.Element
}

export interface State {
    listTrees: NormalizedState<ListTreeState>
}

export type Events = UIEvent<{
    createNewChildList: { name: string; listId: string }
    toggleShowNewChildInput: { listId: string }
    toggleShowChildren: { listId: string }
}>

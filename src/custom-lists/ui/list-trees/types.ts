import type { DragEventHandler } from 'react'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type {
    PageAnnotationsCacheInterface,
    UnifiedList,
} from 'src/annotations/cache/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { UIEvent } from 'ui-logic-core'
import type { TaskState } from 'ui-logic-core/lib/types'

export interface ListTreeState {
    unifiedId: UnifiedList['unifiedId']
    hasChildren: boolean
    wasListDropped: boolean
    areChildrenShown: boolean
    isNewChildInputShown: boolean
    newChildListCreateState: TaskState
}

export interface ListTreeActions {
    toggleShowChildren: () => void
    toggleShowNewChildInput: () => void
    createChildList: (name: string) => void
}

export interface DragNDropActions {
    onDragEnter: DragEventHandler
    onDragLeave: DragEventHandler
    onDragStart: DragEventHandler
    onDragEnd: DragEventHandler
    onDrop: DragEventHandler
    isDraggedOver: boolean
}

export interface Dependencies {
    cache: PageAnnotationsCacheInterface
    listsBG: RemoteCollectionsInterface
    authBG: AuthRemoteFunctionsInterface

    /** Order is delegated to called - pass down already sorted. */
    lists: UnifiedList[]
    areListsBeingFiltered: boolean
    allowRootLevelReordering?: boolean

    children: (
        list: UnifiedList,
        treeState: ListTreeState,
        actions: ListTreeActions,
        dndActions: DragNDropActions,
    ) => JSX.Element
}

export interface State {
    listTrees: NormalizedState<ListTreeState>
    draggedListId: string | null
    dragOverListId: string | null
}

export type Events = UIEvent<{
    createNewChildList: { name: string; parentListId: string }
    toggleShowNewChildInput: { listId: string }
    toggleShowChildren: { listId: string }
    setDragOverListId: { listId: string | null }
    startListDrag: { listId: string }
    endListDrag: null
    dropOnList: { dropTargetListId: string }
}>

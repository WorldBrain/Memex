import { mapTreeTraverse } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import { defaultOrderableSorter } from '@worldbrain/memex-common/lib/utils/item-ordering'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { State, Dependencies } from './types'

export function getVisibleTreeNodesInOrder(
    lists: UnifiedList[],
    { listTrees }: Pick<State, 'listTrees'>,
    opts: Pick<Dependencies, 'sortChildrenByOrder' | 'areListsBeingFiltered'>,
): UnifiedList[] {
    // Intermediary state used to omit nested lists if any of their ancestors are collapsed
    let listShowFlag = new Map<string, boolean>() // TODO: This is hard to understand. How do we improve it?

    let rootNodes = lists.filter((list) => list.parentUnifiedId == null) // Top-level iteration only goes over roots
    let orderedNodes = rootNodes.flatMap((root) =>
        mapTreeTraverse({
            root,
            strategy: 'dfs',
            getChildren: (list) => {
                let children = lists.filter(
                    (l) => l.parentUnifiedId === list.unifiedId,
                )
                if (opts.sortChildrenByOrder) {
                    children.sort(defaultOrderableSorter)
                }
                return children.reverse()
            },
            cb: (list) => {
                let parentListTreeState = listTrees.byId[list.parentUnifiedId]
                let currentListTreeState = listTrees.byId[list.unifiedId]
                if (currentListTreeState == null) {
                    return null
                }
                if (list.parentUnifiedId != null) {
                    let parentShowFlag = listShowFlag.get(list.parentUnifiedId)
                    if (
                        !opts.areListsBeingFiltered && // Always toggle children shown when filtering lists by query
                        (!parentShowFlag ||
                            !parentListTreeState?.areChildrenShown)
                    ) {
                        return null
                    }
                }
                listShowFlag.set(list.unifiedId, true)
                return list
            },
        }),
    )
    return orderedNodes.filter(Boolean)
}

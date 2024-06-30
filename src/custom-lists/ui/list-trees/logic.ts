import { UILogic, UIEventHandler } from 'ui-logic-core'
import type { Dependencies, State, Events } from './types'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from './constants'
import {
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import type { PageAnnotationsCacheEvents } from 'src/annotations/cache/types'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class ListTreesLogic extends UILogic<State, Events> {
    constructor(private deps: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        listTrees: initNormalizedState(),
        draggedListId: null,
        dragOverListId: null,
    })

    init: EventHandler<'init'> = async ({ event, previousState }) => {
        // Keep state.listTrees in-sync with the cached lists
        this.deps.cache.events.addListener(
            'newListsState',
            this.cacheListsSubscription,
        )
        // Manually invoke once to set up the initial state
        this.cacheListsSubscription(this.deps.cache.lists)
    }

    cleanup: EventHandler<'cleanup'> = async ({ previousState }) => {
        this.deps.cache.events.removeListener(
            'newListsState',
            this.cacheListsSubscription,
        )
    }

    private cacheListsSubscription: PageAnnotationsCacheEvents['newListsState'] = (
        nextLists,
    ) => {
        this.emitMutation({
            listTrees: {
                $apply: (prev) =>
                    initNormalizedState({
                        getId: (state) => state.unifiedId,
                        seedData: normalizedStateToArray(nextLists).map(
                            (list) => {
                                let prevState = prev.byId[list.unifiedId]
                                return {
                                    unifiedId: list.unifiedId,
                                    wasListDropped: false,
                                    areChildrenShown:
                                        prevState?.areChildrenShown ?? false,
                                    isNewChildInputShown:
                                        prevState?.isNewChildInputShown ??
                                        false,
                                    newChildListCreateState:
                                        prevState?.newChildListCreateState ??
                                        'pristine',
                                    hasChildren:
                                        this.deps.cache.getListsByParentId(
                                            list.unifiedId,
                                        ).length > 0,
                                }
                            },
                        ),
                    }),
            },
        })
    }

    createNewChildList: EventHandler<'createNewChildList'> = async ({
        event,
    }) => {
        // TODO: Properly set up async state with error handling
        let parentList = this.deps.cache.lists.byId[event.parentListId]
        let newListName = event.name.trim()
        if (!newListName.length || !parentList?.localId) {
            return
        }

        let {
            localListId,
            remoteListId,
            collabKey,
        } = await this.deps.listsBG.createCustomList({
            name: newListName,
            parentListId: parentList.localId!,
        })
        let user = await this.deps.authBG.getCurrentUser()
        this.deps.cache.addList({
            type: 'user-list',
            name: newListName,
            localId: localListId,
            collabKey: collabKey,
            remoteId: remoteListId,
            creator: { type: 'user-reference', id: user.id },
            unifiedAnnotationIds: [],
            hasRemoteAnnotationsToLoad: false,
            parentLocalId: parentList.localId!,
            pathLocalIds: [...parentList.pathLocalIds, parentList.localId!],
            isPrivate: true,
        })
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.parentListId]: {
                        isNewChildInputShown: { $set: false },
                        newChildListCreateState: { $set: 'success' },
                    },
                },
            },
        })
    }

    toggleShowChildren: EventHandler<'toggleShowChildren'> = ({
        event,
        previousState,
    }) => {
        let prevState = previousState.listTrees.byId[event.listId]
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.listId]: {
                        areChildrenShown: { $set: !prevState.areChildrenShown },
                    },
                },
            },
        })
    }

    toggleShowNewChildInput: EventHandler<'toggleShowNewChildInput'> = ({
        event,
        previousState,
    }) => {
        let prevState = previousState.listTrees.byId[event.listId]
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.listId]: {
                        isNewChildInputShown: {
                            $set: !prevState.isNewChildInputShown,
                        },
                        // Couple tree toggle state to this. If not open, open it. Else leave it
                        areChildrenShown: {
                            $set: !prevState.isNewChildInputShown
                                ? true
                                : prevState.areChildrenShown,
                        },
                    },
                },
            },
        })
    }

    setDragOverListId: EventHandler<'setDragOverListId'> = ({ event }) => {
        this.emitMutation({ dragOverListId: { $set: event.listId } })
    }

    startListDrag: EventHandler<'startListDrag'> = ({ event }) => {
        this.emitMutation({ draggedListId: { $set: event.listId } })
    }

    endListDrag: EventHandler<'endListDrag'> = ({}) => {
        this.emitMutation({ draggedListId: { $set: null } })
    }

    dropOnList: EventHandler<'dropOnList'> = async ({
        event,
        previousState,
    }) => {
        this.emitMutation({ dragOverListId: { $set: null } })
        let draggedListId = previousState.draggedListId
        let listToMove = this.deps.cache.lists.byId[draggedListId]
        if (!listToMove || listToMove.unifiedId === event.dropTargetListId) {
            return
        }

        if (event.dropTargetListId.endsWith(LIST_REORDER_POST_EL_POSTFIX)) {
            let cleanedListId = event.dropTargetListId.slice(
                0,
                event.dropTargetListId.length -
                    LIST_REORDER_POST_EL_POSTFIX.length,
            )
            await this.handleDropOnReorderLine(draggedListId, cleanedListId, {
                areTargetListChildrenShown:
                    previousState.listTrees.byId[cleanedListId]
                        ?.areChildrenShown,
            })
            return
        }
        if (event.dropTargetListId.endsWith(LIST_REORDER_PRE_EL_POSTFIX)) {
            let cleanedListId = event.dropTargetListId.slice(
                0,
                event.dropTargetListId.length -
                    LIST_REORDER_PRE_EL_POSTFIX.length,
            )
            await this.handleDropOnReorderLine(draggedListId, cleanedListId, {
                isBeforeFirstRoot: true,
                areTargetListChildrenShown:
                    previousState.listTrees.byId[cleanedListId]
                        ?.areChildrenShown,
            })
            return
        }

        // We only actualy want to perform the move if being dropped on a different parent list
        if (listToMove.parentUnifiedId !== event.dropTargetListId) {
            await this.performListTreeMove(
                draggedListId,
                event.dropTargetListId,
            )
        }

        let targetSiblingLists = this.deps.cache
            .getListsByParentId(event.dropTargetListId)
            .filter((list) => list.unifiedId !== draggedListId)
        // Ensure the moved list is ordered as the first among existing siblings
        if (targetSiblingLists.length > 0) {
            await this.performListTreeReorder(draggedListId, {
                targetListId: targetSiblingLists[0].unifiedId,
            })
        }
    }

    private async handleDropOnReorderLine(
        listId: string,
        dropTargetListId: string,
        params?: {
            isBeforeFirstRoot?: boolean
            areTargetListChildrenShown?: boolean
        },
    ): Promise<void> {
        if (listId == null || dropTargetListId === listId) {
            return
        }
        let { cache } = this.deps
        let targetList = cache.lists.byId[dropTargetListId]
        let draggedList = cache.lists.byId[listId]

        // Edge case: if a list is being dropped on the root level, and the root level is not allowed to be reordered, simply move it to be a root
        if (
            !this.deps.allowRootLevelReordering &&
            targetList.parentUnifiedId == null &&
            draggedList != null
        ) {
            if (draggedList.parentUnifiedId != null) {
                await this.performListTreeMove(listId, null)
            }
        }
        // Edge case: dropping before the first root always orders the dragged list first among all roots
        else if (params?.isBeforeFirstRoot) {
            let targetSiblings = cache.getListsByParentId(
                targetList.parentUnifiedId,
            )
            if (draggedList.parentUnifiedId !== targetList.parentUnifiedId) {
                await this.performListTreeMove(
                    listId,
                    targetList.parentUnifiedId,
                )
            }
            if (targetSiblings.length) {
                await this.performListTreeReorder(listId, {
                    targetListId: targetSiblings[0].unifiedId,
                })
            }
        } // If the target list tree is toggled open, the behavior is that the dragged list becomes a child of it (if not already)
        else if (params?.areTargetListChildrenShown) {
            let targetSiblings = cache.getListsByParentId(targetList.unifiedId)
            if (draggedList.parentUnifiedId !== targetList.unifiedId) {
                await this.performListTreeMove(listId, targetList.unifiedId)
            }
            if (targetSiblings.length) {
                await this.performListTreeReorder(listId, {
                    targetListId: targetSiblings[0].unifiedId,
                })
            }
        } // Else the behavior is that the dragged list becomes the next sibling after the target list
        else {
            let targetSiblings = cache.getListsByParentId(
                targetList.parentUnifiedId,
            )
            if (draggedList.parentUnifiedId !== targetList.parentUnifiedId) {
                await this.performListTreeMove(
                    listId,
                    targetList.parentUnifiedId,
                )
            }
            if (targetSiblings.length) {
                let isFinalSibling = false
                let targetIndex = targetSiblings.findIndex(
                    (list) => list.unifiedId === targetList.unifiedId,
                )
                // If we're on the last sibling we need to flag that and put the index back one to point at the last sibling
                if (targetIndex === targetSiblings.length - 1) {
                    targetIndex--
                    isFinalSibling = true
                }
                await this.performListTreeReorder(listId, {
                    targetListId: targetSiblings[targetIndex + 1]?.unifiedId,
                    isFinalSibling,
                })
            }
        }
    }

    private async performListTreeMove(listId: string, newParentListId: string) {
        let becomesTopLevelRoot = newParentListId == null
        let { cache } = this.deps
        let listData = cache.lists.byId[listId]
        let dropTargetListData = becomesTopLevelRoot
            ? null
            : cache.lists.byId[newParentListId]

        if (
            listData?.localId == null ||
            (!becomesTopLevelRoot && dropTargetListData?.localId == null)
        ) {
            return
        }

        if (becomesTopLevelRoot) {
            cache.updateList({
                unifiedId: listId,
                parentUnifiedId: null,
            })
            await this.deps.listsBG.updateListTreeParent({
                localListId: listData.localId!,
                parentListId: dropTargetListData?.localId! ?? null,
            })
            return
        }

        let isListAncestorOfTargetList =
            dropTargetListData.unifiedId === listId ||
            dropTargetListData.pathUnifiedIds.includes(listId)

        if (isListAncestorOfTargetList) {
            throw new Error(
                'Cannot make list a child of a descendent - this would result in a cycle',
            )
        }

        this.emitMutation({
            listTrees: {
                byId: {
                    [newParentListId]: {
                        hasChildren: { $set: true },
                        wasListDropped: { $set: true },
                    },
                },
            },
        })

        cache.updateList({
            unifiedId: listId,
            parentUnifiedId: newParentListId,
        })

        setTimeout(() => {
            this.emitMutation({
                listTrees: {
                    byId: {
                        [newParentListId]: {
                            wasListDropped: { $set: false },
                        },
                    },
                },
            })
        }, 2000)

        await this.deps.listsBG.updateListTreeParent({
            localListId: listData.localId!,
            parentListId: dropTargetListData.localId!,
        })
    }

    // TODO: Simplify this. Half the logic is just getting the same data that the callers need to get
    private async performListTreeReorder(
        listId: string,
        targetListParams: {
            targetListId: string
            isFinalSibling?: boolean
        },
    ): Promise<void> {
        let { cache } = this.deps
        let targetList = cache.lists.byId[targetListParams.targetListId]
        let draggedList = cache.lists.byId[listId]

        let targetSiblingLists = targetList
            ? cache.getListsByParentId(targetList.parentUnifiedId)
            : []
        let index = targetSiblingLists.findIndex(
            (list) => list.unifiedId === targetListParams.targetListId,
        )
        let items = targetSiblingLists.map((list) => ({
            id: list.unifiedId,
            key: list.order,
        }))
        let order =
            index === -1 || targetListParams.isFinalSibling
                ? pushOrderedItem(items, draggedList.unifiedId).create.key
                : insertOrderedItemBeforeIndex(
                      items,
                      draggedList.unifiedId,
                      index,
                  ).create.key

        if (order !== draggedList.order) {
            cache.updateList({
                unifiedId: draggedList.unifiedId,
                order,
            })
            await this.deps.listsBG.updateListTreeOrder({
                localListId: draggedList.localId!,
                siblingListIds: targetSiblingLists.map((list) => list.localId!),
                intendedIndexAmongSiblings: targetListParams.isFinalSibling
                    ? targetSiblingLists.length
                    : index,
            })
        }
    }
}

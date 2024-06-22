import React, { useState, useEffect } from 'react'
import styled, { css } from 'styled-components'
import { mapTreeTraverse } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import type { UnifiedList } from 'src/annotations/cache/types'
import {
    initNormalizedState,
    NormalizedState,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { DropReceivingState } from '../types'
import SidebarItemInput from './components/sidebar-editable-item'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from '../constants'
import type { TaskState } from 'ui-logic-core/lib/types'

interface ListTreeState {
    unifiedId: UnifiedList['unifiedId']
    hasChildren: boolean
    areChildrenShown: boolean
    isNewChildInputShown: boolean
    newChildListCreateState: TaskState
}

interface ListTreeActions {
    toggleShowChildren: () => void
    toggleShowNewChildInput: () => void
    createChildList: (name: string) => void
}

export interface Props {
    /** Order is delegated to called - pass down already sorted. */
    lists: UnifiedList[]
    draggedListId: string | null
    areListsBeingFiltered: boolean
    onConfirmChildListCreate: (parentListId: string, name: string) => void
    initDropReceivingState: (listId: string) => DropReceivingState

    // New stuff
    renderListItem: (
        list: UnifiedList,
        treeState: ListTreeState,
        actions: ListTreeActions,
    ) => JSX.Element
}

export let ListTrees = (props: Props): JSX.Element => {
    let initListTreeState = (
        { unifiedId }: UnifiedList,
        prevState?: ListTreeState,
    ): ListTreeState => ({
        unifiedId,
        areChildrenShown: prevState?.areChildrenShown ?? false,
        isNewChildInputShown: prevState?.isNewChildInputShown ?? false,
        newChildListCreateState:
            prevState?.newChildListCreateState ?? 'pristine',
        hasChildren:
            props.lists.filter(
                (l) =>
                    l.parentUnifiedId === unifiedId && l.type === 'user-list',
            ).length > 0,
    })

    let [listTreeStates, setListTreeStates] = useState<
        NormalizedState<ListTreeState>
    >(() =>
        initNormalizedState({
            getId: (list) => list.unifiedId,
            seedData: props.lists.map((list) => initListTreeState(list)),
        }),
    )

    // Keep list trees state in sync with passed down lists data
    useEffect(() => {
        let nextState = initNormalizedState({
            getId: (list) => list.unifiedId,
            seedData: props.lists.map((list) =>
                initListTreeState(list, listTreeStates.byId[list.unifiedId]),
            ),
        })
        setListTreeStates(nextState)
    }, [props.lists])

    // Derived state used to hide nested lists if any of their ancestors are collapsed
    // TODO: Make an actual state
    let listShowFlag = new Map<string, boolean>()

    let renderReorderLine = (listId: string, topItem?: boolean) => {
        // Disable reordering when filtering lists by query
        if (props.areListsBeingFiltered) {
            return null
        }

        let reorderLineDropReceivingState = props.initDropReceivingState(
            `${listId}${
                topItem
                    ? LIST_REORDER_PRE_EL_POSTFIX
                    : LIST_REORDER_POST_EL_POSTFIX
            }`,
        )
        return (
            <ReorderLine
                topItem={topItem}
                isActive={props.draggedListId != null}
                isVisible={reorderLineDropReceivingState.isDraggedOver}
                onDragEnter={reorderLineDropReceivingState.onDragEnter}
                onDragLeave={reorderLineDropReceivingState.onDragLeave}
                onDragOver={(e: React.DragEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                }} // Needed to allow the `onDrop` event to fire
                onDrop={(e: React.DragEvent) => {
                    e.preventDefault()
                    reorderLineDropReceivingState.onDrop(
                        e.dataTransfer,
                        listTreeStates.byId[listId]?.areChildrenShown,
                    )
                }}
            />
        )
    }

    let listElements = props.lists
        .filter((l) => l.parentUnifiedId == null) // Top-level iteration only goes over roots
        .map((root, index) =>
            // Then, for each root, we iterate over their descendents
            mapTreeTraverse({
                root,
                strategy: 'dfs',
                getChildren: (list) =>
                    props.lists
                        .filter((l) => l.parentUnifiedId === list.unifiedId)
                        .reverse(),
                cb: (list) => {
                    let parentListTreeState =
                        listTreeStates.byId[list.parentUnifiedId]
                    let currentListTreeState =
                        listTreeStates.byId[list.unifiedId]
                    // This case only happens on a newly created list, as props.lists will update before the tree state has a chance to reactively update based on that
                    if (currentListTreeState == null) {
                        return null
                    }

                    let actions: ListTreeActions = {
                        createChildList: (name) => {
                            props.onConfirmChildListCreate(list.unifiedId, name)
                            setListTreeStates({
                                ...listTreeStates,
                                byId: {
                                    ...listTreeStates.byId,
                                    [list.unifiedId]: {
                                        ...listTreeStates.byId[list.unifiedId],
                                        isNewChildInputShown: false,
                                        newChildListCreateState: 'success',
                                    },
                                },
                            })
                        },
                        toggleShowChildren: () =>
                            setListTreeStates({
                                ...listTreeStates,
                                byId: {
                                    ...listTreeStates.byId,
                                    [list.unifiedId]: {
                                        ...listTreeStates.byId[list.unifiedId],
                                        areChildrenShown: !listTreeStates.byId[
                                            list.unifiedId
                                        ].areChildrenShown,
                                    },
                                },
                            }),
                        toggleShowNewChildInput: () => {
                            let prevState = listTreeStates.byId[list.unifiedId]
                            return setListTreeStates({
                                ...listTreeStates,
                                byId: {
                                    ...listTreeStates.byId,
                                    [list.unifiedId]: {
                                        ...prevState,
                                        isNewChildInputShown: !prevState.isNewChildInputShown,
                                        // Couple tree toggle state to this. If not open, open it. Else leave it
                                        areChildrenShown: !prevState.isNewChildInputShown
                                            ? true
                                            : prevState.areChildrenShown,
                                    },
                                },
                            })
                        },
                    }

                    if (list.parentUnifiedId != null) {
                        let parentShowFlag = listShowFlag.get(
                            list.parentUnifiedId,
                        )
                        if (
                            !props.areListsBeingFiltered && // Always toggle children shown when filtering lists by query
                            (!parentShowFlag ||
                                !parentListTreeState?.areChildrenShown)
                        ) {
                            return null
                        }
                    }
                    listShowFlag.set(list.unifiedId, true)

                    let nestedListInput: JSX.Element = null
                    if (
                        currentListTreeState.areChildrenShown &&
                        currentListTreeState.isNewChildInputShown
                    ) {
                        nestedListInput = (
                            <ChildListInputContainer
                                indentSteps={list.pathUnifiedIds.length}
                                // ref={inputContainerRef}
                            >
                                <SidebarItemInput
                                    onCancelClick={
                                        actions.toggleShowNewChildInput
                                    }
                                    onConfirmClick={actions.createChildList}
                                    // onChange={() =>
                                    //     this.moveItemIntoHorizontalView(
                                    //         this.nestedInputBoxRef.current,
                                    //     )
                                    // }
                                    // scrollIntoView={() =>
                                    //     this.moveItemIntoHorizontalView(
                                    //         this.nestedInputBoxRef.current,
                                    //     )
                                    // }
                                />
                            </ChildListInputContainer>
                        )
                    }
                    return (
                        <React.Fragment key={list.unifiedId}>
                            {index === 0 &&
                                renderReorderLine(list.unifiedId, true)}
                            {props.renderListItem(
                                list,
                                listTreeStates.byId[list.unifiedId],
                                actions,
                            )}
                            {renderReorderLine(list.unifiedId)}
                            {nestedListInput}
                        </React.Fragment>
                    )
                },
            }),
        )
        .flat()

    return <>{listElements}</>
}

let ChildListInputContainer = styled.div<{ indentSteps: number }>`
    margin-left: ${(props) =>
        props.indentSteps > 0
            ? (props.indentSteps - 1) * 20
            : props.indentSteps * 20}px;
`

let ReorderLine = styled.div<{
    isVisible: boolean
    isActive: boolean
    topItem: boolean
}>`
    position: relative;
    z-index: -1;
    border-bottom: 3px solid
        ${(props) =>
            props.isVisible && props.isActive
                ? props.theme.colors.prime3
                : 'transparent'};
    &::before {
        content: '';
        width: 100%;
        top: -10px;
        position: absolute;
        height: 10px;
        z-index: 2;
        background: transparent;
    }
    &::after {
        content: '';
        width: 100%;
        bottom: -13px;
        position: absolute;
        height: 10px;
        z-index: 2;
        background: transparent;
    }

    ${(props) =>
        props.isActive &&
        css`
            z-index: 2147483647;
        `}
    ${(props) =>
        props.topItem &&
        css`
            display: none;

            &:first-child {
                display: flex;
            }
        `}
`

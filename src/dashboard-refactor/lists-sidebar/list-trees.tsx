import React from 'react'
import styled, { css } from 'styled-components'
import { mapTreeTraverse } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { NormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { DropReceivingState } from '../types'
import SidebarItemInput from './components/sidebar-editable-item'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from '../constants'
import type { ListTreeInteractions } from './types'

export interface Props {
    /** Order is delegated to called - pass down already sorted. */
    lists: UnifiedList[]
    draggedListId: string | null
    areListsBeingFiltered: boolean
    listTreeInteractionStates: NormalizedState<ListTreeInteractions>
    onNestedListInputToggle: (listId: string) => void
    onConfirmNestedListCreate: (parentListId: string, name: string) => void
    initDropReceivingState: (listId: string) => DropReceivingState

    // New stuff
    renderListItem: (list: UnifiedList) => JSX.Element
}

export let ListTrees = (props: Props) => {
    // Derived state used to hide nested lists if any of their ancestors are collapsed
    let listShowFlag = new Map<string, boolean>()
    let rootLists = props.lists.filter((l) => l.parentUnifiedId == null)

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
                    reorderLineDropReceivingState.onDrop(e.dataTransfer)
                }}
                topItem={topItem}
            />
        )
    }

    let listElements = rootLists
        .map((currList, index) =>
            mapTreeTraverse({
                root: currList,
                strategy: 'dfs',
                getChildren: (list) =>
                    props.lists
                        .filter((l) => l.parentUnifiedId === list.unifiedId)
                        .reverse(),
                cb: (list) => {
                    let parentListTreeState =
                        props.listTreeInteractionStates.byId[
                            list.parentUnifiedId
                        ]
                    let currentListTreeState =
                        props.listTreeInteractionStates.byId[list.unifiedId]

                    if (list.parentUnifiedId != null) {
                        let parentShowFlag = listShowFlag.get(
                            list.parentUnifiedId,
                        )
                        if (
                            !props.areListsBeingFiltered && // Always toggle children shown when filtering lists by query
                            (!parentShowFlag ||
                                !parentListTreeState?.isTreeToggled)
                        ) {
                            return null
                        }
                    }
                    listShowFlag.set(list.unifiedId, true)

                    let nestedListInput: JSX.Element = null
                    if (
                        currentListTreeState.isTreeToggled &&
                        currentListTreeState.isNestedListInputShown
                    ) {
                        nestedListInput = (
                            <ChildListInputContainer
                                indentSteps={list.pathUnifiedIds.length}
                                // ref={inputContainerRef}
                            >
                                <SidebarItemInput
                                    onCancelClick={() =>
                                        props.onNestedListInputToggle(
                                            list.unifiedId,
                                        )
                                    }
                                    onConfirmClick={(name) =>
                                        props.onConfirmNestedListCreate(
                                            list.unifiedId,
                                            name,
                                        )
                                    }
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
                            {props.renderListItem(list)}
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

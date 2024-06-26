import React from 'react'
import styled, { css } from 'styled-components'
import { mapTreeTraverse } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import { StatefulUIElement } from 'src/util/ui-logic'
import { ListTreesLogic } from './logic'
import type { Dependencies, State, Events, ListTreeActions } from './types'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from 'src/dashboard-refactor/constants'
import SidebarItemInput from 'src/dashboard-refactor/lists-sidebar/components/sidebar-editable-item'

export interface Props extends Dependencies {}

export class ListTrees extends StatefulUIElement<Props, State, Events> {
    constructor(props: Props) {
        super(props, new ListTreesLogic(props))
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        // Keep state.listTrees in sync with any upstream list add/deletes
        if (prevProps.lists.length !== this.props.lists.length) {
            ;(this.logic as ListTreesLogic).syncListWithTreeState(
                this.props.lists,
                this.state,
            )
        }
    }

    private renderReorderLine = (listId: string, topItem?: boolean) => {
        // Disable reordering when filtering lists by query
        if (this.props.areListsBeingFiltered) {
            return null
        }

        let reorderLineDropReceivingState = this.props.initDropReceivingState(
            `${listId}${
                topItem
                    ? LIST_REORDER_PRE_EL_POSTFIX
                    : LIST_REORDER_POST_EL_POSTFIX
            }`,
        )
        return (
            <ReorderLine
                topItem={topItem}
                isActive={this.props.draggedListId != null}
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
                        this.state.listTrees.byId[listId]?.areChildrenShown,
                    )
                }}
            />
        )
    }

    render() {
        // Derived state used to hide nested lists if any of their ancestors are collapsed
        // TODO: Make an actual state
        let listShowFlag = new Map<string, boolean>()

        let listElements = this.props.lists
            .filter((l) => l.parentUnifiedId == null) // Top-level iteration only goes over roots
            .map((root, index) =>
                // Then, for each root, we iterate over their descendents
                mapTreeTraverse({
                    root,
                    strategy: 'dfs',
                    getChildren: (list) =>
                        this.props.lists
                            .filter((l) => l.parentUnifiedId === list.unifiedId)
                            .reverse(),
                    cb: (list) => {
                        let parentListTreeState = this.state.listTrees.byId[
                            list.parentUnifiedId
                        ]
                        let currentListTreeState = this.state.listTrees.byId[
                            list.unifiedId
                        ]
                        // This case only happens on a newly created list, as this.props.lists will update before the tree state has a chance to reactively update based on that
                        if (currentListTreeState == null) {
                            return null
                        }

                        let actions: ListTreeActions = {
                            createChildList: (name) =>
                                this.processEvent('createNewChildList', {
                                    name,
                                    listId: list.unifiedId,
                                }),
                            toggleShowChildren: () =>
                                this.processEvent('toggleShowChildren', {
                                    listId: list.unifiedId,
                                }),
                            toggleShowNewChildInput: () =>
                                this.processEvent('toggleShowNewChildInput', {
                                    listId: list.unifiedId,
                                }),
                        }

                        if (list.parentUnifiedId != null) {
                            let parentShowFlag = listShowFlag.get(
                                list.parentUnifiedId,
                            )
                            if (
                                !this.props.areListsBeingFiltered && // Always toggle children shown when filtering lists by query
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
                                    this.renderReorderLine(
                                        list.unifiedId,
                                        true,
                                    )}
                                {this.props.renderListItem(
                                    list,
                                    this.state.listTrees.byId[list.unifiedId],
                                    actions,
                                )}
                                {this.renderReorderLine(list.unifiedId)}
                                {nestedListInput}
                            </React.Fragment>
                        )
                    },
                }),
            )
            .flat()

        return <>{listElements}</>
    }
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

import React from 'react'
import styled, { css } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import { ListTreesLogic } from './logic'
import type {
    Dependencies,
    State,
    Events,
    ListTreeActions,
    DragNDropActions,
} from './types'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from './constants'
import SidebarItemInput from 'src/dashboard-refactor/lists-sidebar/components/sidebar-editable-item'
import { getVisibleTreeNodesInOrder } from './util'

export interface Props extends Dependencies {}

export class ListTrees extends StatefulUIElement<Props, State, Events> {
    constructor(props: Props) {
        super(props, new ListTreesLogic(props))
    }

    private initDropReceivingState = (listId: string): DragNDropActions => ({
        isDraggedOver: this.state.dragOverListId === listId,
        onDragEnter: (e) => {
            e.preventDefault()
            e.stopPropagation()
            // Needed to push this op back on the event queue, so it fires after the previous
            //  list item's `onDropLeave` event
            setTimeout(
                () =>
                    this.processEvent('setDragOverListId', {
                        listId,
                    }),
                0,
            )
        },
        onDragLeave: (e) => {
            e.preventDefault()
            e.stopPropagation()
            return this.processEvent('setDragOverListId', {
                listId: null,
            })
        },
        onDrop: (e) => {
            e.preventDefault()
            return this.processEvent('dropOnList', { dropTargetListId: listId })
        },
        onDragStart: (e) =>
            this.processEvent('startListDrag', {
                listId,
            }),
        onDragEnd: (e) => this.processEvent('endListDrag', null),
    })

    private renderReorderLine = (listId: string, topLine?: boolean) => {
        // Disable reordering when filtering lists by query
        if (this.props.areListsBeingFiltered) {
            return null
        }

        let reorderLineDropReceivingState = this.initDropReceivingState(
            `${listId}${
                topLine
                    ? LIST_REORDER_PRE_EL_POSTFIX
                    : LIST_REORDER_POST_EL_POSTFIX
            }`,
        )
        return (
            <ReorderLine
                topItem={topLine}
                isActive={this.state.draggedListId != null}
                onDrop={reorderLineDropReceivingState.onDrop}
                isVisible={reorderLineDropReceivingState.isDraggedOver}
                onDragEnter={reorderLineDropReceivingState.onDragEnter}
                onDragLeave={reorderLineDropReceivingState.onDragLeave}
                onDragOver={(e) => {
                    // Needed to allow the `onDrop` event to fire
                    e.preventDefault()
                    e.stopPropagation()
                }}
            />
        )
    }

    render() {
        let orderedTreeNodes = getVisibleTreeNodesInOrder(
            this.props.lists,
            this.state,
            this.props,
        )

        return orderedTreeNodes.map((list, index) => {
            let actions: ListTreeActions = {
                createChildList: (name) =>
                    this.processEvent('createNewChildList', {
                        name,
                        parentListId: list.unifiedId,
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
            let currentListTreeState = this.state.listTrees.byId[list.unifiedId]

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
                            onCancelClick={actions.toggleShowNewChildInput}
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
                        this.renderReorderLine(list.unifiedId, true)}
                    {this.props.children(
                        list,
                        this.state.listTrees.byId[list.unifiedId],
                        actions,
                        this.initDropReceivingState(list.unifiedId),
                    )}
                    {this.renderReorderLine(list.unifiedId)}
                    {nestedListInput}
                </React.Fragment>
            )
        })
    }
}

let ChildListInputContainer = styled.div<{ indentSteps: number }>`
    margin-left: ${(props) =>
        props.indentSteps > 0
            ? (props.indentSteps - 1) * 20
            : props.indentSteps * 20}px;
    width: 100%;
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

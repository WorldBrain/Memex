import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-storage/lib/lists/constants'

import colors from 'src/dashboard-refactor/colors'
import { SidebarLockedState, SidebarPeekState } from './types'
import ListsSidebarGroup, {
    ListsSidebarGroupProps,
} from './components/sidebar-group'
import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from './components/search-bar'
import Margin from '../components/Margin'
import ListsSidebarItem, {
    Props as ListsSidebarItemProps,
} from './components/sidebar-item-with-menu'
import { sizeConstants } from '../constants'
import { DropReceivingState } from '../types'
import ListsSidebarEditableItem from './components/sidebar-editable-item'

const Sidebar = styled.div<{
    locked: boolean
    peeking: boolean
}>`
    display: flex;
    flex-direction: column;
    justify-content: start;
    width: ${sizeConstants.listsSidebar.widthPx}px;
    position: fixed;
    top: ${sizeConstants.header.heightPx}px;
    z-index: 1;

    ${(props) =>
        props.locked &&
        css`
            height: 100%;
            background-color: ${colors.white};
            box-shadow: rgb(16 30 115 / 3%) 4px 0px 16px;
        `}
    ${(props) =>
        props.peeking &&
        css`
            height: max-content;
            background-color: ${colors.white};
            box-shadow: 2px 0px 4px rgba(0, 0, 0, 0.25);
            margin-top: 9px;
            margin-bottom: 9px;
            height: 90vh;
        `}
    ${(props) =>
        !props.peeking &&
        !props.locked &&
        css`
            display: none;
        `}
`

const Container = styled.div``

const PeekTrigger = styled.div`
    height: 100%;
    width: 10px;
    position: absolute;
    background: transparent;
    /* z-index: 3000; */
`

export interface ListsSidebarProps {
    openFeedUrl: () => void
    onListSelection: (id: number) => void
    isAllSavedSelected: boolean
    onAllSavedSelection: () => void
    hasFeedActivity?: boolean
    inboxUnreadCount: number
    selectedListId?: number
    lockedState: SidebarLockedState
    peekState: SidebarPeekState
    searchBarProps: ListsSidebarSearchBarProps
    listsGroups: ListsSidebarGroupProps[]
    initDropReceivingState: (listId: number) => DropReceivingState
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    private renderLists = (
        lists: ListsSidebarItemProps[],
        canReceiveDroppedItems: boolean,
    ) =>
        lists.map((listObj, idx) =>
            listObj.isEditing ? (
                <ListsSidebarEditableItem
                    key={idx}
                    {...listObj.editableProps}
                />
            ) : (
                <ListsSidebarItem
                    key={idx}
                    dropReceivingState={{
                        ...this.props.initDropReceivingState(listObj.listId),
                        canReceiveDroppedItems,
                    }}
                    {...listObj}
                />
            ),
        )

    render() {
        const {
            lockedState: { isSidebarLocked },
            peekState: { isSidebarPeeking },
            searchBarProps,
            listsGroups,
        } = this.props
        return (
            <Container
                onMouseLeave={this.props.peekState.setSidebarPeekState(false)}
            >
                <PeekTrigger
                    onMouseEnter={this.props.peekState.setSidebarPeekState(
                        true,
                    )}
                    onDragEnter={this.props.peekState.setSidebarPeekState(true)}
                />
                <Sidebar peeking={isSidebarPeeking} locked={isSidebarLocked}>
                    <Margin>
                        <ListsSidebarSearchBar {...searchBarProps} />
                    </Margin>
                    <Margin vertical="10px">
                        <ListsSidebarGroup isExpanded loadingState="success">
                            {this.renderLists(
                                [
                                    {
                                        name: 'All Saved',
                                        listId: -1,
                                        selectedState: {
                                            isSelected: this.props
                                                .isAllSavedSelected,
                                            onSelection: this.props
                                                .onAllSavedSelection,
                                        },
                                    },
                                    {
                                        name: 'Inbox',
                                        listId: SPECIAL_LIST_IDS.INBOX,
                                        newItemsCount: this.props
                                            .inboxUnreadCount,
                                        selectedState: {
                                            isSelected:
                                                this.props.selectedListId ===
                                                SPECIAL_LIST_IDS.INBOX,
                                            onSelection: this.props
                                                .onListSelection,
                                        },
                                    },
                                    {
                                        name: 'Saved on Mobile',
                                        listId: SPECIAL_LIST_IDS.MOBILE,
                                        selectedState: {
                                            isSelected:
                                                this.props.selectedListId ===
                                                SPECIAL_LIST_IDS.MOBILE,
                                            onSelection: this.props
                                                .onListSelection,
                                        },
                                    },
                                    {
                                        name: 'Feed',
                                        listId: SPECIAL_LIST_IDS.INBOX + 2,
                                        hasActivity: this.props.hasFeedActivity,
                                        selectedState: {
                                            isSelected: false,
                                            onSelection: this.props.openFeedUrl,
                                        },
                                    },
                                ],
                                false,
                            )}
                        </ListsSidebarGroup>
                    </Margin>
                    {listsGroups.map((group, i) => (
                        <Margin key={i} vertical="10px">
                            <ListsSidebarGroup {...group}>
                                {group.isAddInputShown && (
                                    <ListsSidebarEditableItem
                                        onConfirmClick={group.confirmAddNewList}
                                        onCancelClick={group.cancelAddNewList}
                                    />
                                )}
                                {this.renderLists(group.listsArray, true)}
                            </ListsSidebarGroup>
                        </Margin>
                    ))}
                </Sidebar>
            </Container>
        )
    }
}

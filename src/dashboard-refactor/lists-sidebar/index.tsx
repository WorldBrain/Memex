import React, { PureComponent } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { fonts } from 'src/dashboard-refactor/styles'
import ListsSidebarGroup, {
    Props as SidebarGroupProps,
} from './components/sidebar-group'
import ListsSidebarSearchBar, {
    ListsSidebarSearchBarProps,
} from './components/search-bar'
import SpaceContextMenuBtn, {
    Props as SpaceContextMenuBtnProps,
} from './components/space-context-menu-btn'
import SpaceEditMenuBtn, {
    Props as SpaceEditMenuBtnProps,
} from './components/space-edit-menu-btn'
import DropTargetSidebarItem from './components/drop-target-sidebar-item'
import FollowedListSidebarItem from './components/followed-list-sidebar-item'
import StaticSidebarItem from './components/static-sidebar-item'
import SidebarItemInput from './components/sidebar-editable-item'
import Margin from '../components/Margin'
import type { RootState as ListsSidebarState } from './types'
import type { DropReceivingState } from '../types'
import type { UnifiedList } from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './constants'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import {
    defaultTreeNodeSorter,
    mapTreeTraverse,
} from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { LIST_REORDER_EL_POST } from '../constants'

type ListGroup = Omit<SidebarGroupProps, 'listsCount'> & {
    listData: UnifiedList[]
}

export interface ListsSidebarProps extends ListsSidebarState {
    switchToFeed: () => void
    onListSelection: (id: string | null) => void
    openRemoteListPage: (remoteListId: string) => void
    onCancelAddList: () => void
    onTreeToggle: (listId: string) => void
    onNestedListInputToggle: (listId: string) => void
    setNestedListInputValue: (listId: string, value: string) => void
    onConfirmNestedListCreate: (parentListId: string) => Promise<void>
    onConfirmAddList: (value: string) => void
    onListDragStart: (listId: string) => React.DragEventHandler
    onListDragEnd: (listId: string) => React.DragEventHandler
    setSidebarPeekState: (isPeeking: boolean) => () => void
    initDropReceivingState: (listId: string) => DropReceivingState
    initContextMenuBtnProps: (
        listId: string,
    ) => Omit<
        SpaceContextMenuBtnProps,
        | 'isMenuDisplayed'
        | 'errorMessage'
        | 'listData'
        | 'isCreator'
        | 'isShared'
    > &
        Pick<
            SpaceEditMenuBtnProps,
            'onDeleteSpaceConfirm' | 'onDeleteSpaceIntent'
        > & {
            spacesBG: RemoteCollectionsInterface
        }
    searchBarProps: ListsSidebarSearchBarProps
    ownListsGroup: ListGroup
    joinedListsGroup: ListGroup
    followedListsGroup: ListGroup
    onConfirmListEdit: (listId: string, value: string) => void
    currentUser: any
    onConfirmListDelete: (listId: string) => void
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    private renderListTreeNode = (list: UnifiedList) => {
        const reorderLineDropReceivingState = this.props.initDropReceivingState(
            list.unifiedId + LIST_REORDER_EL_POST,
        )
        return (
            <>
                <ReorderLine
                    isVisible={reorderLineDropReceivingState.isDraggedOver}
                    onDragEnter={(e: React.DragEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Needed to push this op back on the event queue, so it fires after the previous
                        //  list item's `onDropLeave` event
                        setTimeout(
                            () => reorderLineDropReceivingState.onDragEnter(),
                            0,
                        )
                    }}
                    onDragLeave={reorderLineDropReceivingState.onDragLeave}
                    onDragOver={(e: React.DragEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }} // Needed to allow the `onDrop` event to fire
                    onDrop={(e: React.DragEvent) => {
                        e.preventDefault()
                        reorderLineDropReceivingState.onDrop(e.dataTransfer)
                    }}
                />
                <DropTargetSidebarItem
                    key={list.unifiedId}
                    indentSteps={list.pathUnifiedIds.length}
                    onDragStart={this.props.onListDragStart(list.unifiedId)}
                    onDragEnd={this.props.onListDragEnd(list.unifiedId)}
                    // zIndex={10000000 - i}
                    name={`${list.pathUnifiedIds.length}: ${list.name}`}
                    isSelected={this.props.selectedListId === list.unifiedId}
                    onClick={() => this.props.onListSelection(list.unifiedId)}
                    dropReceivingState={this.props.initDropReceivingState(
                        list.unifiedId,
                    )}
                    isPrivate={list.isPrivate}
                    isShared={!list.isPrivate}
                    areAnyMenusDisplayed={
                        this.props.showMoreMenuListId === list.unifiedId ||
                        this.props.editMenuListId === list.unifiedId
                    }
                    renderLeftSideIcon={() => (
                        <Icon
                            icon={
                                this.props.listTrees.byId[list.unifiedId]
                                    ?.isTreeToggled
                                    ? 'arrowDown'
                                    : 'arrowRight'
                            }
                            heightAndWidth="20px"
                            onClick={(event) => {
                                event.stopPropagation()
                                this.props.onTreeToggle(list.unifiedId)
                            }}
                        />
                    )}
                    renderRightSideIcon={() => {
                        return (
                            <>
                                <Icon
                                    icon="plus"
                                    heightAndWidth="20px"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        this.props.onNestedListInputToggle(
                                            list.unifiedId,
                                        )
                                    }}
                                />
                                <SpaceContextMenuBtn
                                    {...this.props.initContextMenuBtnProps(
                                        list.unifiedId,
                                    )}
                                    listData={list}
                                    isCreator={
                                        list.creator?.id ===
                                        this.props.currentUser?.id
                                    }
                                    isMenuDisplayed={
                                        this.props.showMoreMenuListId ===
                                        list.unifiedId
                                    }
                                    errorMessage={
                                        this.props.editListErrorMessage
                                    }
                                    isShared={!list.isPrivate}
                                />
                            </>
                        )
                    }}
                    renderEditIcon={() => (
                        <SpaceEditMenuBtn
                            {...this.props.initContextMenuBtnProps(
                                list.unifiedId,
                            )}
                            listData={list}
                            isCreator={
                                list.creator?.id === this.props.currentUser?.id
                            }
                            isMenuDisplayed={
                                this.props.editMenuListId === list.unifiedId
                            }
                            errorMessage={this.props.editListErrorMessage}
                            onConfirmSpaceNameEdit={(newName) => {
                                this.props.onConfirmListEdit(
                                    list.unifiedId,
                                    newName,
                                )
                            }}
                        />
                    )}
                />
            </>
        )
    }

    private renderListTrees() {
        const rootLists = this.props.ownListsGroup.listData.filter(
            (list) => list.parentUnifiedId == null,
        )

        // Derived state used to hide nested lists if any of their ancestors are collapsed
        const listShowFlag = new Map<string, boolean>()

        return rootLists
            .map((root) =>
                mapTreeTraverse({
                    root,
                    strategy: 'dfs',
                    getChildren: (list) =>
                        this.props.ownListsGroup.listData
                            .filter(
                                (_list) =>
                                    _list.parentUnifiedId === list.unifiedId,
                            )
                            .sort(defaultTreeNodeSorter)
                            .reverse(),
                    cb: (list) => {
                        const parentListTreeState = this.props.listTrees.byId[
                            list.parentUnifiedId
                        ]
                        const currentListTreeState = this.props.listTrees.byId[
                            list.unifiedId
                        ]

                        if (list.parentUnifiedId != null) {
                            const parentShowFlag = listShowFlag.get(
                                list.parentUnifiedId,
                            )
                            if (
                                !parentShowFlag ||
                                !parentListTreeState?.isTreeToggled
                            ) {
                                return null
                            }
                        }
                        listShowFlag.set(list.unifiedId, true)

                        // TODO: This renders the new list input directly under the list. It's meant to be rendered after all the list's children.
                        //  With the current state shape that's quite difficult to do. Maybe need to change to recursive rendering of a node's children type thing
                        let nestedListInput: JSX.Element = null
                        if (
                            currentListTreeState.isTreeToggled &&
                            currentListTreeState.isNestedListInputShown
                        ) {
                            nestedListInput = (
                                <NestedListInput
                                    type="text"
                                    indentSteps={list.pathUnifiedIds.length}
                                    placeholder="+ add new subspace"
                                    autoFocus
                                    disabled={
                                        currentListTreeState.newNestedListCreateState ===
                                        'running'
                                    }
                                    value={
                                        currentListTreeState.newNestedListValue
                                    }
                                    onKeyDown={async (event) => {
                                        const metaKeyPressed =
                                            navigator.platform === 'MacIntel'
                                                ? event.metaKey
                                                : event.ctrlKey
                                        // TODO: Make confirm method more intuitive
                                        if (
                                            event.key === 'Enter' &&
                                            metaKeyPressed
                                        ) {
                                            await this.props.onConfirmNestedListCreate(
                                                list.unifiedId,
                                            )
                                        }
                                    }}
                                    onChange={(event) =>
                                        this.props.setNestedListInputValue(
                                            list.unifiedId,
                                            event.target.value,
                                        )
                                    }
                                />
                            )
                        }
                        return (
                            <>
                                {this.renderListTreeNode(list)}
                                {nestedListInput}
                            </>
                        )
                    },
                }),
            )
            .flat()
    }

    render() {
        return (
            <Container
                onMouseOver={this.props.setSidebarPeekState(true)}
                spaceSidebarWidth={this.props.spaceSidebarWidth}
            >
                <GlobalStyle />
                <SidebarInnerContent>
                    <TopGroup>
                        <StaticSidebarItem
                            icon="feed"
                            name="Notifications"
                            isSelected={
                                this.props.selectedListId ===
                                SPECIAL_LIST_STRING_IDS.FEED
                            }
                            onClick={this.props.switchToFeed}
                            renderRightSideIcon={
                                this.props.hasFeedActivity
                                    ? () => <ActivityBeacon />
                                    : null
                            }
                            forceRightSidePermanentDisplay
                        />
                        <StaticSidebarItem
                            icon="heartEmpty"
                            name="All Saved"
                            isSelected={this.props.selectedListId == null}
                            onClick={() => this.props.onListSelection(null)}
                        />
                        <StaticSidebarItem
                            icon="inbox"
                            name="Inbox"
                            isSelected={
                                this.props.selectedListId ===
                                SPECIAL_LIST_STRING_IDS.INBOX
                            }
                            onClick={() =>
                                this.props.onListSelection(
                                    SPECIAL_LIST_STRING_IDS.INBOX,
                                )
                            }
                            renderRightSideIcon={
                                this.props.inboxUnreadCount > 0
                                    ? () => (
                                          <NewItemsCount>
                                              <NewItemsCountInnerDiv>
                                                  {this.props.inboxUnreadCount}
                                              </NewItemsCountInnerDiv>
                                          </NewItemsCount>
                                      )
                                    : null
                            }
                            forceRightSidePermanentDisplay
                        />
                        <StaticSidebarItem
                            icon="phone"
                            name="From Mobile"
                            isSelected={
                                this.props.selectedListId ==
                                SPECIAL_LIST_STRING_IDS.MOBILE
                            }
                            onClick={() =>
                                this.props.onListSelection(
                                    SPECIAL_LIST_STRING_IDS.MOBILE,
                                )
                            }
                        />
                    </TopGroup>
                    <Separator />
                    <Margin top="10px">
                        <ListsSidebarSearchBar {...this.props.searchBarProps} />
                    </Margin>
                    <ListsSidebarGroup
                        {...this.props.ownListsGroup}
                        listsCount={this.props.ownListsGroup.listData.length}
                    >
                        {this.props.isAddListInputShown && (
                            <SidebarItemInput
                                onCancelClick={this.props.onCancelAddList}
                                onConfirmClick={this.props.onConfirmAddList}
                                errorMessage={this.props.addListErrorMessage}
                            />
                        )}
                        {this.renderListTrees()}
                    </ListsSidebarGroup>
                    <ListsSidebarGroup
                        {...this.props.followedListsGroup}
                        listsCount={
                            this.props.followedListsGroup.listData.length
                        }
                    >
                        {this.props.followedListsGroup.listData.map((list) => (
                            <FollowedListSidebarItem
                                key={list.unifiedId}
                                name={list.name}
                                onClick={() =>
                                    this.props.openRemoteListPage(
                                        list.remoteId!,
                                    )
                                }
                            />
                        ))}
                    </ListsSidebarGroup>
                    <ListsSidebarGroup
                        {...this.props.joinedListsGroup}
                        listsCount={this.props.joinedListsGroup.listData.length}
                    >
                        {this.props.joinedListsGroup.listData.map((list) => (
                            <DropTargetSidebarItem
                                key={list.unifiedId}
                                name={list.name}
                                isSelected={
                                    this.props.selectedListId === list.unifiedId
                                }
                                onClick={() =>
                                    this.props.onListSelection(list.unifiedId)
                                }
                                dropReceivingState={this.props.initDropReceivingState(
                                    list.unifiedId,
                                )}
                                isPrivate={list.isPrivate}
                                isShared={!list.isPrivate}
                            />
                        ))}
                    </ListsSidebarGroup>
                </SidebarInnerContent>
            </Container>
        )
    }
}

const Container = styled.div<{ spaceSidebarWidth: number }>`
    position: sticky;
    z-index: 2147483645;
    width: ${(props) => props.spaceSidebarWidth}px;
    display: flex;
    justify-content: center;
    height: fill-available;
    overflow: scroll;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const Separator = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};

    &::last-child {
        border-top: 'unset';
    }
`

const SidebarInnerContent = styled.div`
    overflow-y: scroll;
    overflow-x: visible;
    height: fill-available;
    width: fill-available;
    padding-bottom: 100px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const NoCollectionsMessage = styled.div`
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    cursor: pointer;
    padding: 0px 15px;
    margin: 5px 10px;
    width: fill-available;
    margin-top: 5px;
    height: 40px;
    justify-content: flex-start;
    border-radius: 5px;

    & * {
        cursor: pointer;
    }

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale1};
    }
`

const GlobalStyle = createGlobalStyle`

    .sidebarResizeHandleSidebar {
        width: 6px !important;
        height: 99% !important;
        margin-top: 5px !important;
        top: 1px !important;
        position: relative;
        right: -3px !important;
        border-radius: 0 3px 3px 0;

        &:hover {
            background: #5671cf30 !important;
        }
    }
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: 400;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    white-space: nowrap;
`

const Link = styled.span`
    color: ${(props) => props.theme.colors.prime1};
    padding-left: 3px;
`

const TopGroup = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0px;
`

const ActivityBeacon = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 20px;
    background-color: ${(props) => props.theme.colors.prime1};
`

const NewItemsCount = styled.div`
    width: fit-content;
    min-width: 20px;
    height: 14px;
    border-radius: 30px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background-color: ${(props) => props.theme.colors.prime1};
    padding: 2px 4px;
    color: ${(props) => props.theme.colors.black};
    text-align: center;
    font-weight: 500;
    justify-content: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    padding: 2px 0px;
`

const NestedListInput = styled.input`
    margin-left: ${(props) => props.indentSteps * 20}px;
`

const ReorderLine = styled.div<{ isVisible: boolean }>`
    border-bottom: 3px solid
        ${(props) =>
            props.isVisible
                ? props.theme.colors.prime3
                : props.theme.colors.greyScale1};
`

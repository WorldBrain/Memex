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
import DropTargetSidebarItem from './components/drop-target-sidebar-item'
import FollowedListSidebarItem from './components/followed-list-sidebar-item'
import StaticSidebarItem from './components/static-sidebar-item'
import SidebarItemInput from './components/sidebar-editable-item'
import Margin from '../components/Margin'
import type { RootState as ListsSidebarState } from './types'
import type { DropReceivingState } from '../types'
import type { UnifiedList } from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './constants'

type ListGroup = Omit<SidebarGroupProps, 'listsCount'> & {
    listData: UnifiedList[]
}

export interface ListsSidebarProps extends ListsSidebarState {
    switchToFeed: () => void
    onListSelection: (id: string | null) => void
    openRemoteListPage: (remoteListId: string) => void
    onCancelAddList: () => void
    onConfirmAddList: (value: string) => void
    setSidebarPeekState: (isPeeking: boolean) => () => void
    initDropReceivingState: (listId: string) => DropReceivingState
    initContextMenuBtnProps: (
        listId: string,
    ) => Omit<
        SpaceContextMenuBtnProps,
        'isMenuDisplayed' | 'errorMessage' | 'listData'
    >
    searchBarProps: ListsSidebarSearchBarProps
    ownListsGroup: ListGroup
    joinedListsGroup: ListGroup
    followedListsGroup: ListGroup
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    render() {
        return (
            <Container
                onMouseOver={
                    !this.props.isSidebarLocked &&
                    this.props.setSidebarPeekState(true)
                }
                spaceSidebarWidth={this.props.spaceSidebarWidth}
            >
                <GlobalStyle />
                <SidebarInnerContent>
                    <TopGroup>
                        <StaticSidebarItem
                            icon="feed"
                            name="Activity Feed"
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
                        listsCount={
                            this.props.ownListsGroup.listData.filter(
                                (list) => list.type !== 'page-link',
                            ).length
                        }
                    >
                        {this.props.isAddListInputShown && (
                            <SidebarItemInput
                                onCancelClick={this.props.onCancelAddList}
                                onConfirmClick={this.props.onConfirmAddList}
                                errorMessage={this.props.addListErrorMessage}
                            />
                        )}
                        {this.props.ownListsGroup.listData
                            .filter(() => {})
                            .map(
                                (list) =>
                                    list.type !== 'page-link' && (
                                        <DropTargetSidebarItem
                                            key={list.unifiedId}
                                            name={list.name}
                                            isSelected={
                                                this.props.selectedListId ===
                                                list.unifiedId
                                            }
                                            onClick={() =>
                                                this.props.onListSelection(
                                                    list.unifiedId,
                                                )
                                            }
                                            dropReceivingState={this.props.initDropReceivingState(
                                                list.unifiedId,
                                            )}
                                            isCollaborative={
                                                list.remoteId != null
                                            }
                                            renderRightSideIcon={() => (
                                                <SpaceContextMenuBtn
                                                    {...this.props.initContextMenuBtnProps(
                                                        list.unifiedId,
                                                    )}
                                                    listData={list}
                                                    isMenuDisplayed={
                                                        this.props
                                                            .showMoreMenuListId ===
                                                        list.unifiedId
                                                    }
                                                    errorMessage={
                                                        this.props
                                                            .editListErrorMessage
                                                    }
                                                />
                                            )}
                                        />
                                    ),
                            )}
                    </ListsSidebarGroup>
                    <ListsSidebarGroup
                        {...this.props.followedListsGroup}
                        listsCount={
                            this.props.followedListsGroup.listData.filter(
                                (list) => list.type !== 'page-link',
                            ).length
                        }
                    >
                        {this.props.followedListsGroup.listData.map(
                            (list) =>
                                list.type !== 'page-link' && (
                                    <FollowedListSidebarItem
                                        key={list.unifiedId}
                                        name={list.name}
                                        onClick={() =>
                                            this.props.openRemoteListPage(
                                                list.remoteId!,
                                            )
                                        }
                                    />
                                ),
                        )}
                    </ListsSidebarGroup>
                    <ListsSidebarGroup
                        {...this.props.joinedListsGroup}
                        listsCount={
                            this.props.joinedListsGroup.listData.filter(
                                (list) => list.type !== 'page-link',
                            ).length
                        }
                    >
                        {this.props.joinedListsGroup.listData.map(
                            (list) =>
                                list.type !== 'page-link' && (
                                    <DropTargetSidebarItem
                                        key={list.unifiedId}
                                        name={list.name}
                                        isSelected={
                                            this.props.selectedListId ===
                                            list.unifiedId
                                        }
                                        onClick={() =>
                                            this.props.onListSelection(
                                                list.unifiedId,
                                            )
                                        }
                                        dropReceivingState={this.props.initDropReceivingState(
                                            list.unifiedId,
                                        )}
                                        isCollaborative
                                    />
                                ),
                        )}
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
        height: 100% !important;
        right: -3px !important;

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

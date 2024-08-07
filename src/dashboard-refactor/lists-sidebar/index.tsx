import React, { PureComponent } from 'react'
import styled, { createGlobalStyle, css } from 'styled-components'
import { fonts } from 'src/dashboard-refactor/styles'
import throttle from 'lodash/throttle'
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
import type { UnifiedList } from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './constants'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { ListTrees } from 'src/custom-lists/ui/list-trees'
import type {
    DragNDropActions,
    Dependencies as ListTreesDeps,
} from 'src/custom-lists/ui/list-trees/types'
import { ListTreeToggleArrow } from 'src/custom-lists/ui/list-trees/components/tree-toggle-arrow'

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
    initDNDActions: (listId: string) => DragNDropActions
    setFocusedListId: (listId: UnifiedList['unifiedId'] | null) => void
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
    spaceSidebarWidth: string
    getRootElement: () => HTMLElement
    isInPageMode: boolean
    listTreesDeps: Omit<ListTreesDeps, 'children'> & {
        ref: React.RefObject<ListTrees>
    }
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    private sidebarItemRefs: React.RefObject<HTMLDivElement>[]

    constructor(props: ListsSidebarProps) {
        super(props)
        // Initialize an array of refs
        this.sidebarItemRefs = []
    }

    private setSidebarItemRefs = (
        element: HTMLDivElement,
        unifiedId: number | string,
    ) => {
        // Ensure the refs array has a slot for the current index
        if (!this.sidebarItemRefs[unifiedId]) {
            this.sidebarItemRefs[unifiedId] = React.createRef()
        }
        // Replace the ref object with a new one that has the element
        this.sidebarItemRefs[unifiedId] = { current: element }
    }

    private moveItemIntoHorizontalView = throttle((itemRef: HTMLElement) => {
        if (itemRef && itemRef.parentElement) {
            // container dimensions and scroll position
            const scrollContainer =
                itemRef.parentElement.parentElement.parentElement

            const currentScrollLeft = scrollContainer.scrollLeft

            // item dimensions and position
            const itemLeft = itemRef.offsetLeft

            let scrollLeft = 0
            if (itemLeft < 11) {
                scrollLeft = 0
            } else {
                scrollLeft = itemLeft - 10
            }

            // needed for somehow waiting for the toggle animation to complete
            setTimeout(() => {
                scrollContainer.scrollLeft = scrollLeft
            }, 0)
        }
    }, 100)

    render() {
        return (
            <Container
                onMouseOver={this.props.setSidebarPeekState(true)}
                spaceSidebarWidth={this.props.spaceSidebarWidth}
                inPageMode={this.props.isInPageMode}
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
                            spaceSidebarWidth={this.props.spaceSidebarWidth}
                        />
                        <StaticSidebarItem
                            icon="heartEmpty"
                            name="All Saved"
                            isSelected={this.props.selectedListId == null}
                            onClick={() => this.props.onListSelection(null)}
                            spaceSidebarWidth={this.props.spaceSidebarWidth}
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
                            spaceSidebarWidth={this.props.spaceSidebarWidth}
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
                            spaceSidebarWidth={this.props.spaceSidebarWidth}
                        />
                    </TopGroup>
                    <Separator />
                    <Margin top="10px">
                        <ListsSidebarSearchBar {...this.props.searchBarProps} />
                    </Margin>
                    <ListsSidebarGroup
                        {...this.props.ownListsGroup}
                        listsCount={this.props.ownListsGroup.listData.length}
                        spaceSidebarWidth={this.props.spaceSidebarWidth}
                        getRootElement={this.props.getRootElement}
                    >
                        {this.props.isAddListInputShown && (
                            <SidebarItemInput
                                onCancelClick={this.props.onCancelAddList}
                                onConfirmClick={this.props.onConfirmAddList}
                                errorMessage={this.props.addListErrorMessage}
                            />
                        )}
                        <ListTrees {...this.props.listTreesDeps}>
                            {(list, treeState, actions, dndActions) => (
                                <DropTargetSidebarItem
                                    sidebarItemRef={(el) =>
                                        this.setSidebarItemRefs(
                                            el,
                                            list.unifiedId,
                                        )
                                    }
                                    spaceSidebarWidth={
                                        this.props.spaceSidebarWidth
                                    }
                                    key={list.unifiedId}
                                    indentSteps={list.pathUnifiedIds.length}
                                    name={`${list.name}`}
                                    isFocused={
                                        this.props.focusedListId ===
                                        list.unifiedId
                                    }
                                    setFocused={(isFocused) =>
                                        this.props.setFocusedListId(
                                            isFocused ? list.unifiedId : null,
                                        )
                                    }
                                    isSelected={
                                        this.props.selectedListId ===
                                        list.unifiedId
                                    }
                                    onClick={() => {
                                        this.props.onListSelection(
                                            list.unifiedId,
                                        )

                                        this.moveItemIntoHorizontalView(
                                            this.sidebarItemRefs[list.unifiedId]
                                                .current,
                                        )
                                    }}
                                    alwaysShowLeftSideIcon={
                                        treeState.hasChildren
                                    }
                                    dragNDropActions={{
                                        ...dndActions,
                                        onDrop: (e) => {
                                            // This handles list-on-list drops (state encapsulated inside <ListTrees>)
                                            dndActions.onDrop(e)
                                            // This handles page-on-list drops (state in dashboard)
                                            this.props
                                                .initDNDActions(list.unifiedId)
                                                .onDrop(e)
                                        },
                                        wasPageDropped: this.props.lists.byId[
                                            list.unifiedId
                                        ]?.wasPageDropped,
                                    }}
                                    isPrivate={list.isPrivate}
                                    isShared={!list.isPrivate}
                                    areAnyMenusDisplayed={
                                        this.props.showMoreMenuListId ===
                                            list.unifiedId ||
                                        this.props.editMenuListId ===
                                            list.unifiedId
                                    }
                                    renderLeftSideIcon={() => (
                                        <ListTreeToggleArrow
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                            treeState={treeState}
                                            actions={actions}
                                        />
                                    )}
                                    renderRightSideIcon={() => {
                                        return (
                                            <RightSideIconBox>
                                                <SpaceContextMenuBtn
                                                    {...this.props.initContextMenuBtnProps(
                                                        list.unifiedId,
                                                    )}
                                                    listData={list}
                                                    isCreator={
                                                        list.creator?.id ===
                                                        this.props.currentUser
                                                            ?.id
                                                    }
                                                    isMenuDisplayed={
                                                        this.props
                                                            .showMoreMenuListId ===
                                                        list.unifiedId
                                                    }
                                                    errorMessage={
                                                        this.props
                                                            .editListErrorMessage
                                                    }
                                                    isShared={!list.isPrivate}
                                                />
                                            </RightSideIconBox>
                                        )
                                    }}
                                    renderEditIcon={() => {
                                        return (
                                            <RightSideIconBox>
                                                <TooltipBox
                                                    placement={'bottom'}
                                                    tooltipText={
                                                        'Add Sub-Space'
                                                    }
                                                    getPortalRoot={
                                                        this.props
                                                            .getRootElement
                                                    }
                                                >
                                                    <Icon
                                                        icon="plus"
                                                        heightAndWidth="18px"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            actions.toggleShowNewChildInput()
                                                        }}
                                                    />
                                                </TooltipBox>
                                                <SpaceEditMenuBtn
                                                    {...this.props.initContextMenuBtnProps(
                                                        list.unifiedId,
                                                    )}
                                                    listData={list}
                                                    isCreator={
                                                        list.creator?.id ===
                                                        this.props.currentUser
                                                            ?.id
                                                    }
                                                    isMenuDisplayed={
                                                        this.props
                                                            .editMenuListId ===
                                                        list.unifiedId
                                                    }
                                                    errorMessage={
                                                        this.props
                                                            .editListErrorMessage
                                                    }
                                                    onConfirmSpaceNameEdit={(
                                                        newName,
                                                    ) => {
                                                        this.props.onConfirmListEdit(
                                                            list.unifiedId,
                                                            newName,
                                                        )
                                                    }}
                                                />
                                            </RightSideIconBox>
                                        )
                                    }}
                                />
                            )}
                        </ListTrees>
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
                                spaceSidebarWidth={this.props.spaceSidebarWidth}
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
                                dragNDropActions={this.props.initDNDActions(
                                    list.unifiedId,
                                )}
                                isPrivate={list.isPrivate}
                                isShared={!list.isPrivate}
                                spaceSidebarWidth={this.props.spaceSidebarWidth}
                            />
                        ))}
                    </ListsSidebarGroup>
                </SidebarInnerContent>
            </Container>
        )
    }
}

const RightSideIconBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
`

const Container = styled.div<{
    spaceSidebarWidth: string
    inPageMode: boolean
}>`
    position: sticky;
    z-index: 2147483645;
    width: ${(props) => props.spaceSidebarWidth};
    display: flex;
    justify-content: center;
    height: fill-available;
    overflow-y: auto;
    overflow-x: hidden;

    ::-webkit-scrollbar {
        background: transparent;
        width: 8px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: transparent;
        margin: 2px 0px 2px 0px;
        width: 8px;
        padding: 1px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${(props) => props.theme.colors.greyScale2};
        border-radius: 10px;
        width: 4px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
    }

    ${(props) =>
        props.inPageMode &&
        css`
            position: relative;
        `}
`

const Separator = styled.div`
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};

    &::last-child {
        border-top: 'unset';
    }
`

const SidebarInnerContent = styled.div`
    height: fill-available;
    width: fill-available;
    padding-bottom: 100px;

    ::-webkit-scrollbar {
        background: transparent;
        width: 8px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: transparent;
        margin: 2px 0px 2px 0px;
        width: 8px;
        padding: 1px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${(props) => props.theme.colors.greyScale2};
        border-radius: 10px;
        width: 4px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
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

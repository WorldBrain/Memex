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
import type { DropReceivingState } from '../types'
import type { UnifiedList } from 'src/annotations/cache/types'
import { SPECIAL_LIST_STRING_IDS } from './constants'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { mapTreeTraverse } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    LIST_REORDER_POST_EL_POSTFIX,
    LIST_REORDER_PRE_EL_POSTFIX,
} from '../constants'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

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
    onConfirmNestedListCreate: (parentListId: string, name: string) => void
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
    spaceSidebarWidth: string
    getRootElement: () => HTMLElement
    isInPageMode: boolean
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    private spaceToggleButtonRef = React.createRef<HTMLDivElement>()
    private nestedInputBoxRef = React.createRef<HTMLDivElement>()
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

    private renderReorderLine = (listId: string, topItem?: boolean) => {
        // Disable reordering when filtering lists by query
        if (this.props.filteredListIds.length > 0) {
            return null
        }

        const reorderLineDropReceivingState = this.props.initDropReceivingState(
            listId,
        )
        return (
            <ReorderLine
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
                    reorderLineDropReceivingState.onDrop(e.dataTransfer)
                    this.props.onListDragEnd(null)
                }}
                topItem={topItem}
            />
        )
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

    private renderListTrees() {
        let rootLists = this.props.ownListsGroup.listData.filter(
            (list) => list.parentUnifiedId == null,
        )

        // Derived state used to hide nested lists if any of their ancestors are collapsed
        let listShowFlag = new Map<string, boolean>()

        return rootLists
            .map((root, index) =>
                mapTreeTraverse({
                    root,
                    strategy: 'dfs',
                    getChildren: (list) =>
                        this.props.ownListsGroup.listData
                            .filter(
                                (_list) =>
                                    _list.parentUnifiedId === list.unifiedId,
                            )
                            .reverse(),
                    cb: (list, index2) => {
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
                                this.props.filteredListIds.length === 0 && // Always toggle children shown when filtering lists by query
                                (!parentShowFlag ||
                                    !parentListTreeState?.isTreeToggled)
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
                                    indentSteps={list.pathUnifiedIds.length}
                                    ref={this.nestedInputBoxRef}
                                >
                                    <SidebarItemInput
                                        onCancelClick={() =>
                                            this.props.onNestedListInputToggle(
                                                list.unifiedId,
                                            )
                                        }
                                        onConfirmClick={(name) =>
                                            this.props.onConfirmNestedListCreate(
                                                list.unifiedId,
                                                name,
                                            )
                                        }
                                        onChange={() =>
                                            this.moveItemIntoHorizontalView(
                                                this.nestedInputBoxRef.current,
                                            )
                                        }
                                        scrollIntoView={() =>
                                            this.moveItemIntoHorizontalView(
                                                this.nestedInputBoxRef.current,
                                            )
                                        }
                                    />
                                </NestedListInput>
                            )
                        }
                        return (
                            <React.Fragment key={list.unifiedId}>
                                {index === 0 &&
                                    this.renderReorderLine(
                                        list.unifiedId +
                                            LIST_REORDER_PRE_EL_POSTFIX,
                                        true,
                                    )}
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
                                    onDragStart={this.props.onListDragStart(
                                        list.unifiedId,
                                    )}
                                    onDragEnd={this.props.onListDragEnd(
                                        list.unifiedId,
                                    )}
                                    name={`${list.name}`}
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
                                    hasChildren={
                                        this.props.listTrees.byId[
                                            list.unifiedId
                                        ]?.hasChildren
                                    }
                                    dropReceivingState={this.props.initDropReceivingState(
                                        list.unifiedId,
                                    )}
                                    isPrivate={list.isPrivate}
                                    isShared={!list.isPrivate}
                                    areAnyMenusDisplayed={
                                        this.props.showMoreMenuListId ===
                                            list.unifiedId ||
                                        this.props.editMenuListId ===
                                            list.unifiedId
                                    }
                                    renderLeftSideIcon={() => (
                                        <TooltipBox
                                            tooltipText={
                                                !this.props.listTrees.byId[
                                                    list.unifiedId
                                                ]?.hasChildren
                                                    ? 'Add Sub-Space'
                                                    : this.props.listTrees.byId[
                                                          list.unifiedId
                                                      ].isTreeToggled
                                                    ? 'Hide Sub Spaces'
                                                    : 'Show Sub Spaces'
                                            }
                                            placement="right"
                                            targetElementRef={
                                                this.spaceToggleButtonRef
                                                    .current
                                            }
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
                                        >
                                            <Icon
                                                containerRef={
                                                    this.spaceToggleButtonRef
                                                }
                                                icon={
                                                    !this.props.listTrees.byId[
                                                        list.unifiedId
                                                    ]?.hasChildren
                                                        ? 'plus'
                                                        : this.props.listTrees
                                                              .byId[
                                                              list.unifiedId
                                                          ].isTreeToggled
                                                        ? 'arrowDown'
                                                        : 'arrowRight'
                                                }
                                                heightAndWidth="16px"
                                                color={
                                                    this.props.listTrees.byId[
                                                        list.unifiedId
                                                    ].hasChildren
                                                        ? 'greyScale5'
                                                        : 'greyScale3'
                                                }
                                                onClick={(event) => {
                                                    if (
                                                        this.props.listTrees
                                                            .byId[
                                                            list.unifiedId
                                                        ].hasChildren
                                                    ) {
                                                        this.props.onTreeToggle(
                                                            list.unifiedId,
                                                        )
                                                    } else {
                                                        this.props.onNestedListInputToggle(
                                                            list.unifiedId,
                                                        )
                                                    }
                                                    this.moveItemIntoHorizontalView(
                                                        this.sidebarItemRefs[
                                                            list.unifiedId
                                                        ].current,
                                                    )

                                                    event.stopPropagation()
                                                }}
                                            />
                                        </TooltipBox>
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
                                                            this.props.onNestedListInputToggle(
                                                                list.unifiedId,
                                                            )
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
                                {this.renderReorderLine(
                                    list.unifiedId +
                                        LIST_REORDER_POST_EL_POSTFIX,
                                )}
                                {nestedListInput}
                            </React.Fragment>
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
                                dropReceivingState={this.props.initDropReceivingState(
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

const NestedListInput = styled.div<{ indentSteps: number }>`
    margin-left: ${(props) =>
        props.indentSteps > 0
            ? (props.indentSteps - 1) * 20
            : props.indentSteps * 20}px;
`

const ReorderLine = styled.div<{
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

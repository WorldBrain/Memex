import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

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
import { Rnd } from 'react-rnd'
import { createGlobalStyle } from 'styled-components'
import { UIElementServices } from '@worldbrain/memex-common/lib/services/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import blacklist from 'src/options/blacklist'
export interface ListsSidebarProps {
    openFeedUrl: () => void
    switchToFeed: () => void
    onListSelection: (id: number) => void
    isAllSavedSelected?: boolean
    onAllSavedSelection: (id: number) => void
    hasFeedActivity?: boolean
    inboxUnreadCount: number
    selectedListId?: number
    addListErrorMessage: string | null
    lockedState: SidebarLockedState
    peekState: SidebarPeekState
    searchBarProps: ListsSidebarSearchBarProps
    listsGroups: ListsSidebarGroupProps[]
    initDropReceivingState: (listId: number) => DropReceivingState
    spaceSidebarWidth: number
}

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    private renderLists = (
        lists: ListsSidebarItemProps[],
        canReceiveDroppedItems: boolean,
    ) =>
        lists.map((listObj, i) => (
            <ListsSidebarItem
                key={i}
                dropReceivingState={{
                    ...this.props.initDropReceivingState(listObj.listId),
                    canReceiveDroppedItems,
                }}
                {...listObj}
            />
        ))

    private SidebarContainer = React.createRef()

    private bindRouteGoTo = (route: 'import' | 'sync' | 'backup') => () => {
        window.location.hash = '#/' + route
    }

    render() {
        const {
            lockedState: { isSidebarLocked },
            peekState: { isSidebarPeeking },
            addListErrorMessage,
            searchBarProps,
            listsGroups,
        } = this.props

        return (
            <Container
                onMouseOver={
                    !this.props.lockedState.isSidebarLocked &&
                    this.props.peekState.setSidebarPeekState(true)
                }
                spaceSidebarWidth={this.props.spaceSidebarWidth}
            >
                <GlobalStyle />
                <BottomGroup>
                    <Margin vertical="10px">
                        <ListsSidebarGroup isExpanded loadingState="success">
                            {this.renderLists(
                                [
                                    {
                                        name: 'Activity Feed',
                                        listId: SPECIAL_LIST_IDS.INBOX + 2,
                                        hasActivity: this.props.hasFeedActivity,
                                        selectedState: {
                                            isSelected:
                                                this.props.selectedListId ===
                                                SPECIAL_LIST_IDS.INBOX + 2,
                                            onSelection: this.props
                                                .switchToFeed,
                                        },
                                    },
                                ],
                                false,
                            )}
                        </ListsSidebarGroup>
                    </Margin>
                    <Separator />
                    <Margin vertical="10px">
                        <ListsSidebarGroup isExpanded loadingState="success">
                            {this.renderLists(
                                [
                                    {
                                        name: 'All Saved',
                                        listId: -1,
                                        selectedState: {
                                            isSelected:
                                                this.props.selectedListId ===
                                                null,
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
                                        name: 'From Mobile',
                                        listId: SPECIAL_LIST_IDS.MOBILE,
                                        selectedState: {
                                            isSelected:
                                                this.props.selectedListId ===
                                                SPECIAL_LIST_IDS.MOBILE,
                                            onSelection: this.props
                                                .onListSelection,
                                        },
                                    },
                                ],
                                false,
                            )}
                        </ListsSidebarGroup>
                    </Margin>
                    <Separator />
                    <Margin top="5px">
                        <ListsSidebarSearchBar {...searchBarProps} />
                    </Margin>
                    {listsGroups.map((group, i) => (
                        <>
                            <Margin key={i} vertical="10px">
                                <ListsSidebarGroup {...group}>
                                    {group.isAddInputShown && (
                                        <ListsSidebarEditableItem
                                            onConfirmClick={
                                                group.confirmAddNewList
                                            }
                                            onCancelClick={
                                                group.cancelAddNewList
                                            }
                                            errorMessage={addListErrorMessage}
                                        />
                                    )}
                                    {group.listsArray != null ? (
                                        group.title === 'My Spaces' &&
                                        group.listsArray.length === 0 ? (
                                            !(
                                                !group.isAddInputShown &&
                                                searchBarProps.searchQuery
                                                    .length > 0 && (
                                                    <NoCollectionsMessage
                                                        onClick={
                                                            group.onAddBtnClick
                                                        }
                                                    >
                                                        <SectionCircle>
                                                            <Icon
                                                                filePath={
                                                                    icons.plus
                                                                }
                                                                heightAndWidth="14px"
                                                                color="purple"
                                                                hoverOff
                                                            />
                                                        </SectionCircle>
                                                        <InfoText>
                                                            Create your
                                                            <Link>
                                                                first Space
                                                            </Link>
                                                        </InfoText>
                                                    </NoCollectionsMessage>
                                                )
                                            )
                                        ) : (
                                            <>
                                                {group.title ===
                                                    'Followed Spaces' &&
                                                group.listsArray != null &&
                                                group.listsArray.length === 0 &&
                                                searchBarProps.searchQuery
                                                    .length === 0 ? (
                                                    <NoCollectionsMessage
                                                        onClick={() =>
                                                            window.open(
                                                                'https://links.memex.garden/follow-first-space',
                                                            )
                                                        }
                                                    >
                                                        <SectionCircle>
                                                            <Icon
                                                                filePath={
                                                                    icons.heartEmpty
                                                                }
                                                                heightAndWidth="14px"
                                                                color="purple"
                                                                hoverOff
                                                            />
                                                        </SectionCircle>
                                                        <InfoText>
                                                            Follow your
                                                            <Link>
                                                                first Space
                                                            </Link>
                                                        </InfoText>
                                                    </NoCollectionsMessage>
                                                ) : (
                                                    this.renderLists(
                                                        group.listsArray ??
                                                            undefined,
                                                        true,
                                                    )
                                                )}
                                            </>
                                        )
                                    ) : undefined}
                                </ListsSidebarGroup>
                            </Margin>
                            <Separator />
                        </>
                    ))}
                </BottomGroup>
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
    border-top: 1px solid ${(props) => props.theme.colors.lightHover};

    &::last-child {
        border-top: 'unset';
    }
`

const BottomGroup = styled.div`
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
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
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
    background: ${(props) => props.theme.colors.darkhover};
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
    color: ${(props) => props.theme.colors.purple};
    padding-left: 3px;
`

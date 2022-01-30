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

const Sidebar = styled(Rnd)<{
    locked: boolean
    peeking: boolean
}>`
    display: flex;
    flex-direction: column;
    justify-content: start;
    z-index: 3000;
    width: 200px;

    ${(props) =>
        props.locked &&
        css`
            height: 100%;
            background-color: ${colors.white};
            border-right: solid 1px ${(props) => props.theme.colors.lineGrey};
            padding-top: ${sizeConstants.header.heightPx}px;
        `}
    ${(props) =>
        props.peeking &&
        css`
            height: max-content;
            background-color: ${colors.white};
            box-shadow: rgb(16 30 115 / 3%) 4px 0px 16px;
            margin-top: 50px;
            margin-bottom: 9px;
            height: 90vh;
            top: 5px;
            border-top-right-radius: 3px;
            border-bottom-right-radius: 3px;
        `}
    ${(props) =>
        !props.peeking &&
        !props.locked &&
        css`
            display: none;
        `}
`

const Container = styled.div`
    position: fixed;
    z-index: 3000;
`

const PeekTrigger = styled.div`
    height: 100vh;
    width: 10px;
    position: fixed;
    background: transparent;
`

const TopGroup = styled.div`
    border-top: 1px solid ${colors.lightGrey};
`
const BottomGroup = styled.div<{ sidebarWidth: string }>`
    overflow-y: scroll;
    overflow-x: visible;
    padding-bottom: 100px;
    height: fill-available;
    width: ${(props) => props.sidebarWidth};

    &::-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none;
}
`

const NoCollectionsMessage = styled.div`
    font-size: 12px;
    color: #3a2f45;
    padding: 5px 18px 10px 18px;

    & u {
        cursor: pointer;
    }
`

const GlobalStyle = createGlobalStyle`
    .sidebarResizeHandleSidebar {
        width: 4px !important;
        height: 100% !important;

        &:hover {
            background: #5671cf30;
        }
    }


`

export interface ListsSidebarProps {
    openFeedUrl: () => void
    onListSelection: (id: number) => void
    isAllSavedSelected: boolean
    onAllSavedSelection: () => void
    hasFeedActivity?: boolean
    inboxUnreadCount: number
    selectedListId?: number
    addListErrorMessage: string | null
    lockedState: SidebarLockedState
    peekState: SidebarPeekState
    searchBarProps: ListsSidebarSearchBarProps
    listsGroups: ListsSidebarGroupProps[]
    initDropReceivingState: (listId: number) => DropReceivingState
}

export interface State {
    sidebarWidth: string
}

export default class ListsSidebar extends PureComponent<
    ListsSidebarProps,
    State
> {
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

    state = {
        sidebarWidth: '250px',
    }

    render() {
        const {
            lockedState: { isSidebarLocked },
            peekState: { isSidebarPeeking },
            addListErrorMessage,
            searchBarProps,
            listsGroups,
        } = this.props

        const style = {
            display: !isSidebarPeeking && !isSidebarLocked ? 'none' : 'flex',
            top: '100',
            height: isSidebarPeeking ? '90vh' : '100vh',
        }

        //console.log(this.SidebarContainer)

        return (
            <Container
                onMouseLeave={this.props.peekState.setSidebarPeekState(false)}
                onMouseEnter={
                    !isSidebarLocked &&
                    this.props.peekState.setSidebarPeekState(true)
                }
            >
                <GlobalStyle />
                <PeekTrigger
                    onMouseEnter={this.props.peekState.setSidebarPeekState(
                        true,
                    )}
                    onDragEnter={this.props.peekState.setSidebarPeekState(true)}
                />
                <Sidebar
                    ref={this.SidebarContainer}
                    style={style}
                    size={{ height: isSidebarPeeking ? '90vh' : '100vh' }}
                    peeking={isSidebarPeeking}
                    position={{
                        x:
                            isSidebarLocked &&
                            `$sizeConstants.header.heightPxpx`,
                    }}
                    locked={isSidebarLocked}
                    onMouseEnter={
                        isSidebarPeeking &&
                        this.props.peekState.setSidebarPeekState(true)
                    }
                    default={{ width: 200 }}
                    resizeHandleClasses={{
                        right: 'sidebarResizeHandleSidebar',
                    }}
                    resizeGrid={[1, 0]}
                    dragAxis={'none'}
                    minWidth={'200px'}
                    maxWidth={'500px'}
                    disableDragging={'true'}
                    enableResizing={{
                        top: false,
                        right: true,
                        bottom: false,
                        left: false,
                        topRight: false,
                        bottomRight: false,
                        bottomLeft: false,
                        topLeft: false,
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                        this.setState({ sidebarWidth: ref.style.width })
                    }}
                >
                    <BottomGroup sidebarWidth={this.state.sidebarWidth}>
                        <Margin vertical="10px">
                            <ListsSidebarGroup
                                isExpanded
                                loadingState="success"
                            >
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
                                                    this.props
                                                        .selectedListId ===
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
                                                    this.props
                                                        .selectedListId ===
                                                    SPECIAL_LIST_IDS.MOBILE,
                                                onSelection: this.props
                                                    .onListSelection,
                                            },
                                        },
                                        {
                                            name: 'Activity Feed',
                                            listId: SPECIAL_LIST_IDS.INBOX + 2,
                                            hasActivity: this.props
                                                .hasFeedActivity,
                                            selectedState: {
                                                isSelected: false,
                                                onSelection: this.props
                                                    .openFeedUrl,
                                            },
                                        },
                                    ],
                                    false,
                                )}
                            </ListsSidebarGroup>
                        </Margin>
                        <TopGroup>
                            <Margin top="5px">
                                <ListsSidebarSearchBar {...searchBarProps} />
                            </Margin>
                        </TopGroup>
                        {listsGroups.map((group, i) => (
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
                                    {group.title === 'My Spaces' &&
                                    group.listsArray.length === 0 ? (
                                        <NoCollectionsMessage>
                                            <strong>No saved spaces</strong>{' '}
                                            <br />
                                            <u
                                                onClick={this.bindRouteGoTo(
                                                    'import',
                                                )}
                                            >
                                                Import
                                            </u>{' '}
                                            bookmark folders
                                        </NoCollectionsMessage>
                                    ) : (
                                        <>
                                            {group.title ===
                                                'Followed Spaces' &&
                                            group.listsArray.length === 0 ? (
                                                <NoCollectionsMessage>
                                                    <u
                                                        onClick={() =>
                                                            window.open(
                                                                'https://tutorials.memex.garden/sharing-collections-annotated-pages-and-highlights',
                                                            )
                                                        }
                                                    >
                                                        Collaborate
                                                    </u>{' '}
                                                    with friends or{' '}
                                                    <u
                                                        onClick={() =>
                                                            window.open(
                                                                'https://memex.social/c/oiLz5UIXw9JXermqZmXW',
                                                            )
                                                        }
                                                    >
                                                        follow
                                                    </u>{' '}
                                                    your first space.
                                                </NoCollectionsMessage>
                                            ) : (
                                                this.renderLists(
                                                    group.listsArray,
                                                    true,
                                                )
                                            )}
                                        </>
                                    )}
                                </ListsSidebarGroup>
                            </Margin>
                        ))}
                    </BottomGroup>
                </Sidebar>
                {/* </Rnd> */}
            </Container>
        )
    }
}

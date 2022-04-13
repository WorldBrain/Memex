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
            top: 20px;
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
    z-index: 2147483645;
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
    font-family: 'Inter', sans-serif;
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

    &: hover {
        background-color: ${(props) =>
            props.theme.colors.backgroundColorDarker};
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

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 24px;
    width: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    font-weight: 300;
    font-family: 'Inter', sans-serif;
`

const Link = styled.span`
    color: ${(props) => props.theme.colors.purple};
    padding-left: 3px;
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

        return (
            <Container
                onMouseLeave={this.props.peekState.setSidebarPeekState(false)}
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
                                        !group.isAddInputShown &&
                                        (searchBarProps.searchQuery.length >
                                        0 ? (
                                            <NoCollectionsMessage
                                                onClick={group.onAddBtnClick}
                                            >
                                                <SectionCircle>
                                                    <Icon
                                                        filePath={icons.plus}
                                                        heightAndWidth="14px"
                                                        color="purple"
                                                        hoverOff
                                                    />
                                                </SectionCircle>
                                                <InfoText>
                                                    Create a
                                                    <Link> new Space</Link>
                                                </InfoText>
                                            </NoCollectionsMessage>
                                        ) : (
                                            <NoCollectionsMessage
                                                onClick={group.onAddBtnClick}
                                            >
                                                <SectionCircle>
                                                    <Icon
                                                        filePath={icons.plus}
                                                        heightAndWidth="14px"
                                                        color="purple"
                                                        hoverOff
                                                    />
                                                </SectionCircle>
                                                <InfoText>
                                                    Create your
                                                    <Link>first Space</Link>
                                                </InfoText>
                                            </NoCollectionsMessage>
                                        ))
                                    ) : (
                                        <>
                                            {group.title ===
                                                'Followed Spaces' &&
                                            group.listsArray.length === 0 ? (
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
                                                        <Link>first Space</Link>
                                                    </InfoText>
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

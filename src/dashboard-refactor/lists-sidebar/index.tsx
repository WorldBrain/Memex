import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { ListsSidebarProps } from './types'
import ListsSidebarGroup from './components/lists-sidebar-group'
import ListsSidebarSearchBar from './components/lists-search-bar'
import Margin from '../components/Margin'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-storage/lib/lists/constants'

const Container = styled.div<{
    locked: boolean
    peeking: boolean
}>`
    display: flex;
    flex-direction: column;
    justify-content: start;
    width: 173px;
    ${(props) =>
        props.locked &&
        css`
            height: 100%;
            background-color: ${colors.lightGrey};
        `}
    ${(props) =>
        props.peeking &&
        css`
            height: max-contenth
            background-color: ${colors.white};
            box-shadow: 2px 0px 4px rgba(0, 0, 0, 0.25);
            margin-top: 9px;
            margin-bottom: 9px;
        `}
    ${(props) =>
        !props.peeking &&
        !props.locked &&
        css`
            display: none;
        `}
`

export default class ListsSidebar extends PureComponent<ListsSidebarProps> {
    render() {
        const {
            lockedState: { isSidebarLocked },
            peekState: { isSidebarPeeking },
            searchBarProps,
            listsGroups,
        } = this.props
        return (
            <Container peeking={isSidebarPeeking} locked={isSidebarLocked}>
                <Margin vertical="5px" horizontal="5px">
                    <ListsSidebarSearchBar {...searchBarProps} />
                </Margin>
                <Margin vertical="10px">
                    <ListsSidebarGroup
                        isExpanded
                        loadingState="success"
                        listsArray={[
                            {
                                name: 'All Saved',
                                listId: -1,
                                selectedState: {
                                    isSelected:
                                        this.props.selectedListId === -1,
                                    onSelection: this.props.onListSelection,
                                },
                                hoverState: {} as any,
                            },
                            {
                                name: 'Inbox',
                                listId: SPECIAL_LIST_IDS.INBOX,
                                selectedState: {
                                    isSelected:
                                        this.props.selectedListId ===
                                        SPECIAL_LIST_IDS.INBOX,
                                    onSelection: this.props.onListSelection,
                                },
                                hoverState: {} as any,
                            },
                            {
                                name: 'Saved on Mobile',
                                listId: SPECIAL_LIST_IDS.INBOX + 1,
                                selectedState: {
                                    isSelected:
                                        this.props.selectedListId ===
                                        SPECIAL_LIST_IDS.INBOX + 1,
                                    onSelection: this.props.onListSelection,
                                },
                                hoverState: {} as any,
                            },
                        ]}
                    />
                </Margin>
                {listsGroups.map((group, i) => (
                    <Margin key={i} vertical="10px">
                        <ListsSidebarGroup {...group} />
                    </Margin>
                ))}
            </Container>
        )
    }
}

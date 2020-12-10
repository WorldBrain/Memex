import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { ListsSidebarProps } from './types'
import ListsSidebarGroup from './components/lists-sidebar-group'
import ListsSidebarSearchBar from './components/lists-search-bar'
import Margin from '../components/Margin'

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
            height: max-content;
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
                {listsGroups.map((group) => (
                    <Margin vertical="10px">
                        <ListsSidebarGroup {...group} />
                    </Margin>
                ))}
            </Container>
        )
    }
}

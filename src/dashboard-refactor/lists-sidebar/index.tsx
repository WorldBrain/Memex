import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { ListsSidebarProps } from './types'
import ListsSidebarGroup from './components/lists-sidebar-group'

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
            height: 100%
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
            sidebarLockedState: { isSidebarLocked },
            sidebarPeekState: { isSidebarPeeking },
            listsGroups,
        } = this.props
        return (
            <Container peeking={isSidebarPeeking} locked={isSidebarLocked}>
                {listsGroups.map((group) => {
                    ;<ListsSidebarGroup
                        hasTitle={group.hasTitle}
                        listsGroupTitle={group.listsGroupTitle}
                        listSource={group.listSource}
                        listsArray={group.listsArray}
                        addableState={group.addableState}
                        expandableState={group.expandableState}
                        taskState={group.taskState}
                    />
                })}
            </Container>
        )
    }
}

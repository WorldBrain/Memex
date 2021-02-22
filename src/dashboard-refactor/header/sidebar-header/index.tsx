import React, { PureComponent } from 'react'
import styled from 'styled-components'

import styles from '../../styles'

import { SidebarLockedState, SidebarPeekState } from '../../lists-sidebar/types'
import { HoverState } from '../../types'

import Margin from 'src/dashboard-refactor/components/Margin'
import SidebarToggle from './sidebar-toggle'
import { sizeConstants } from 'src/dashboard-refactor/constants'

const { fonts } = styles

export const SidebarHeaderContainer = styled.div`
    height: 100%;
    width: ${sizeConstants.listsSidebar.widthPx}px;
    display: flex;
    flex-direction: row;
    align-items: center;
`

export const CollectionTitle = styled.p`
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    line-height: 21px;
`

export interface SidebarHeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarPeekState: SidebarPeekState
    sidebarToggleHoverState: HoverState
    selectedListName?: string
}

export default class SidebarHeader extends PureComponent<SidebarHeaderProps> {
    render() {
        const {
            sidebarLockedState,
            sidebarToggleHoverState,
            sidebarPeekState,
            selectedListName: selectedList,
        } = this.props
        return (
            <SidebarHeaderContainer>
                <Margin horizontal="12px">
                    <SidebarToggle
                        sidebarLockedState={sidebarLockedState}
                        hoverState={sidebarToggleHoverState}
                    />
                </Margin>
                {(sidebarLockedState.isSidebarLocked ||
                    sidebarPeekState.isSidebarPeeking) &&
                    selectedList && (
                        <CollectionTitle>{selectedList}</CollectionTitle>
                    )}
            </SidebarHeaderContainer>
        )
    }
}

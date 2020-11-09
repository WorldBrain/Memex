import React, { PureComponent } from 'react'
import styled from 'styled-components'

import styleConstants from '../../styleConstants'

import { SidebarLockedState, SidebarPeekState } from './types'
import { HoverState } from '../../types'

import Margin from 'src/dashboard-refactor/components/Margin'
import SidebarToggle from './SidebarToggle/SidebarToggle'

const { fonts } = styleConstants

export const SidebarHeaderContainer = styled.div`
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
`

export const CollectionTitle = styled.p`
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.bold};
    line-height: 21px;
`

export interface SidebarHeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarPeekState: SidebarPeekState
    sidebarToggleHoverState: HoverState
    selectedList?: string
}

export default class SidebarHeader extends PureComponent<SidebarHeaderProps> {
    render() {
        const {
            sidebarLockedState,
            sidebarToggleHoverState,
            sidebarPeekState,
            selectedList,
        } = this.props
        return (
            <SidebarHeaderContainer>
                <Margin x="12px">
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

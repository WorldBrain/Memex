import React, { PureComponent } from 'react'
import styled from 'styled-components'

import styleConstants from '../../styleConstants'

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

import {
    SidebarLockedState,
    SidebarPeekState,
    SidebarToggleHoverState,
} from './types'

export interface SidebarHeaderProps {
    sidebarLockedState: SidebarLockedState
    sidebarPeekState: SidebarPeekState
    sidebarToggleHoverState: SidebarToggleHoverState
    selectedCollectionHeader?: string
}

export default class SidebarHeader extends PureComponent<SidebarHeaderProps> {
    render() {
        const {
            sidebarLockedState,
            sidebarToggleHoverState,
            sidebarPeekState,
            selectedCollectionHeader,
        } = this.props
        return (
            <SidebarHeaderContainer>
                <Margin x="12px">
                    <SidebarToggle
                        sidebarLockedState={sidebarLockedState}
                        sidebarToggleHoverState={sidebarToggleHoverState}
                    />
                </Margin>
                {(sidebarLockedState.isSidebarLocked ||
                    sidebarPeekState.isSidebarPeeking) &&
                    selectedCollectionHeader && (
                        <CollectionTitle>
                            {selectedCollectionHeader}
                        </CollectionTitle>
                    )}
            </SidebarHeaderContainer>
        )
    }
}

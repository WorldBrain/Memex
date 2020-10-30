import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import SidebarToggle from './SidebarToggle/SidebarToggle'
import { CollectionTitle, SidebarHeaderContainer } from './styledComponents'

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

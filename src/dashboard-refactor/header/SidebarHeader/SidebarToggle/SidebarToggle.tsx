import React, { PureComponent } from 'react'
import { SidebarToggleHoverState, SidebarLockedState } from '../types'
import {
    Container,
    HamburgerButton,
    LeftArrow,
    RightArrow,
} from './styledComponents'

export interface SidebarToggleProps {
    sidebarLockedState: SidebarLockedState
    sidebarToggleHoverState: SidebarToggleHoverState
}

export default class SidebarToggle extends PureComponent<SidebarToggleProps> {
    private renderHoveredState() {
        // if Sidebar is locked (i.e. if SidebarToggle has been clicked), render left-facing arrows
        // else render right-facing
        if (this.props.sidebarLockedState.isSidebarLocked) return <LeftArrow />
        return <RightArrow />
    }
    private renderButton() {
        const { isHovered } = this.props.sidebarToggleHoverState
        if (!isHovered) return <HamburgerButton />
        return this.renderHoveredState()
    }
    render() {
        const {
            sidebarToggleHoverState: { onHoverEnter, onHoverLeave, isHovered },
            sidebarLockedState: { toggleSidebarLockedState },
        } = this.props
        return (
            <Container
                isHovered={isHovered}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                onClick={toggleSidebarLockedState}
            >
                {this.renderButton()}
            </Container>
        )
    }
}

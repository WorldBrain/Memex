import React, { PureComponent } from 'react'
import { HoverState, SidebarLockedState } from './types'
import {
    Container,
    HamburgerButton,
    LeftArrow,
    RightArrow,
} from './styledComponents'

export interface SidebarToggleProps {
    sidebarLockedState: SidebarLockedState
    className?: string
    hoverState: HoverState
}

export default class SidebarToggle extends PureComponent<SidebarToggleProps> {
    private renderHoveredState() {
        // if Sidebar is locked (i.e. if SidebarToggle has been clicked), render left-facing arrows
        // else render right-facing
        if (this.props.sidebarLockedState.isSidebarLocked) return <LeftArrow />
        return <RightArrow />
    }
    private renderButton() {
        const { isHovered } = this.props.hoverState
        if (!isHovered) return <HamburgerButton />
        return this.renderHoveredState()
    }
    render() {
        const {
            hoverState: { onHoverEnter, onHoverLeave, isHovered },
            sidebarLockedState: { onSidebarToggleClick },
        } = this.props
        return (
            <Container
                isHovered={isHovered}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                onClick={onSidebarToggleClick}
            >
                {this.renderButton()}
            </Container>
        )
    }
}

import React from 'react'
import { storiesOf } from '@storybook/react'

import SidebarToggle, {
    SidebarToggleProps,
} from 'src/dashboard-refactor/header/sidebar-toggle'
import { SidebarLockedState } from 'src/dashboard-refactor/lists-sidebar/types'
import { HoverState } from 'src/dashboard-refactor/types'

const stories = storiesOf('Dashboard Refactor|Header/Sidebar Toggle', module)

const sidebarLockedState: SidebarLockedState = {
    isSidebarLocked: false,
    toggleSidebarLockedState: () => {},
}

const hoverState: HoverState = {
    isHovered: false,
    onHoverEnter: () => {},
    onHoverLeave: () => {},
}

const template: SidebarToggleProps = {
    sidebarLockedState,
    hoverState,
}

export const sidebarToggleProps = {
    noHover: {
        ...template,
    },
    unlockedHover: {
        ...template,
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
    lockedHover: {
        sidebarLockedState: {
            ...sidebarLockedState,
            isSidebarLocked: true,
        },
        hoverState: {
            ...hoverState,
            isHovered: true,
        },
    },
}

stories.add('No hover', () => <SidebarToggle {...sidebarToggleProps.noHover} />)
stories.add('Unlocked hover', () => (
    <SidebarToggle {...sidebarToggleProps.unlockedHover} />
))
stories.add('Locked hover', () => (
    <SidebarToggle {...sidebarToggleProps.lockedHover} />
))

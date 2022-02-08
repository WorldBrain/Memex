import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from '../colors'
import { SidebarLockedState } from '../lists-sidebar/types'
import { Icon } from '../styled-components'
import { HoverState } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ButtonTooltip } from 'src/common-ui/components'

const arrowStyles = `
    left: 2px;
    opacity: 1;
    background-size: 18px;
`

export const Container = styled.div`
    height: 80px;
    width: 60px;
    border: none;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1;
    padding-left: 12px;
`

export const BtnBackground = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 3px;
`

export const HamburgerButton = styled.div`
    opacity: 0.8;
    background-image: url('/img/hamburger.svg');
`

export const LeftArrow = styled.div`
    ${arrowStyles}
    background-image: url('/img/doubleArrow.svg');
`

export const RightArrow = styled.div`
    ${arrowStyles}
    background-image: url('/img/doubleArrow.svg');
    transform: rotate(180deg);
    animation: 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
`

export interface SidebarToggleProps {
    sidebarLockedState: SidebarLockedState
    hoverState: HoverState
}

export default class SidebarToggle extends PureComponent<SidebarToggleProps> {
    render() {
        const {
            hoverState: { onHoverEnter, onHoverLeave, isHovered },
            sidebarLockedState: { toggleSidebarLockedState, isSidebarLocked },
        } = this.props

        return (
            <Container
                isHovered={isHovered}
                onMouseLeave={onHoverLeave}
                onClick={toggleSidebarLockedState}
                onMouseEnter={onHoverEnter}
            >
                {isHovered ? (
                    <ButtonTooltip
                        tooltipText={
                            isSidebarLocked ? (
                                <span>
                                    Click to close sidebar.
                                    <br />
                                    Open by hovering on left side of screen
                                </span>
                            ) : (
                                'Click to lock open sidebar'
                            )
                        }
                        position={'right'}
                    >
                        <BtnBackground>
                            {isSidebarLocked ? (
                                <Icon
                                    path={icons.doubleArrow}
                                    rotation="0"
                                    heightAndWidth="20px"
                                />
                            ) : (
                                <Icon
                                    path={icons.doubleArrow}
                                    rotation="180"
                                    heightAndWidth="20px"
                                />
                            )}
                        </BtnBackground>
                    </ButtonTooltip>
                ) : (
                    <Icon path={icons.hamburger} heightAndWidth="20px" />
                )}
            </Container>
        )
    }
}

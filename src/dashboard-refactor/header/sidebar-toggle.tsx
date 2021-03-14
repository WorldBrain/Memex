import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from '../colors'
import { SidebarLockedState } from '../lists-sidebar/types'
import { HoverState } from '../types'

const buttonStyles = `
    height: 20px;
    width: 20px;
    color: ${colors.iconDefault};
    border: none;
    cursor: pointer;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 20px;

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }
`

const arrowStyles = `
    position: absolute;
    left: 2px;
    opacity: 1;
    background-size: 18px;
`

export const Container = styled.div`
    height: 30px;
    width: 30px;
    border: none;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`

export const BtnBackground = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${colors.midGrey};
    background-size: 20px;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 3px;
`

export const HamburgerButton = styled.div`
    ${buttonStyles}
    opacity: 0.8;
    background-image: url('/img/hamburger.svg');
`

export const LeftArrow = styled.div`
    ${buttonStyles}
    ${arrowStyles}
    background-image: url('/img/doubleArrow.svg');
`

export const RightArrow = styled.div`
    ${buttonStyles}
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
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                onClick={toggleSidebarLockedState}
            >
                {isHovered ? (
                    <BtnBackground>
                        {isSidebarLocked ? <LeftArrow /> : <RightArrow />}
                    </BtnBackground>
                ) : (
                    <HamburgerButton />
                )}
            </Container>
        )
    }
}

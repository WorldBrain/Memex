import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Icon } from '../styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'

const arrowStyles = `
    left: 2px;
    opacity: 1;
    background-size: 18px;
`

export const Container = styled.div`
    height: 44px;
    width: 60px;
    border: none;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 1;
    padding-left: 9px;
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

const TriggerArea = styled.div`
    position: absolute;
    height: 80px;
    width: 180px;
    left: 0px;
    top: 0px;
`

export interface SidebarToggleProps {
    isHovered: boolean
    isSidebarLocked: boolean
    onHoverEnter: (id: string) => void
    onHoverLeave: (id: string) => void
    toggleSidebarLockedState: () => void
}

export default class SidebarToggle extends PureComponent<SidebarToggleProps> {
    handleHoverEnter = (event: React.MouseEvent<HTMLDivElement>) => {
        const id = event.currentTarget.id
        this.props.onHoverEnter(id)
    }

    handleHoverLeave = (event: React.MouseEvent<HTMLDivElement>) => {
        const id = event.currentTarget.id
        this.props.onHoverLeave(id)
    }

    render() {
        const { onHoverEnter, onHoverLeave, isHovered } = this.props

        return (
            <Container
                onClick={this.props.toggleSidebarLockedState}
                onMouseEnter={this.handleHoverEnter}
                onMouseLeave={this.handleHoverLeave}
                id="testingthis"
            >
                {!this.props.isSidebarLocked ? (
                    <>
                        {isHovered ? (
                            <Icon
                                path={icons.arrowRight}
                                rotation={0}
                                heightAndWidth="26px"
                            />
                        ) : (
                            <Icon
                                path={icons.hamburger}
                                heightAndWidth="26px"
                            />
                        )}
                        {isHovered && (
                            <TriggerArea
                                onMouseEnter={this.handleHoverEnter}
                                onMouseLeave={this.handleHoverLeave}
                            />
                        )}
                    </>
                ) : (
                    <Icon path={icons.arrowLeft} heightAndWidth="26px" />
                )}

                {/* <BtnBackground>
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
                ) : (

                    <Icon path={icons.hamburger} heightAndWidth="20px" />
                )} */}
            </Container>
        )
    }
}

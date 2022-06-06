import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import { Icon } from 'src/dashboard-refactor/styled-components'
import { ClickAway } from 'src/util/click-away-wrapper'
import SpaceContextMenu, {
    Props as SpaceContextMenuProps,
} from 'src/custom-lists/ui/space-context-menu'

export interface Props
    extends Omit<
        SpaceContextMenuProps,
        'xPosition' | 'yPosition' | 'copyToClipboard'
    > {
    isMenuDisplayed: boolean
    toggleMenu: React.MouseEventHandler
}

export interface State {
    xPosition: number
    yPosition: number
}

export default class SpaceContextMenuButton extends PureComponent<
    Props,
    State
> {
    private buttonRef = React.createRef<HTMLInputElement>()
    private contextMenuRef: React.RefObject<SpaceContextMenu>

    state: State = {
        xPosition: 0,
        yPosition: 0,
    }

    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()

        if (this.props.fixedPositioning) {
            this.setState({ xPosition: 15, yPosition: 20 })
        } else {
            const rect = this.buttonRef?.current?.getBoundingClientRect()

            // Popup

            if (window.outerHeight < 500) {
                this.setState({ xPosition: -200, yPosition: 0 })
            }

            // right side of screen

            if (window.outerWidth - rect.right < 400) {
                this.setState({ xPosition: outerWidth - rect.right })

                //lower side

                if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                    this.setState({ yPosition: outerHeight - rect.bottom + 40 })
                }
                // upper side
                else {
                    this.setState({ yPosition: outerHeight - rect.top + 110 })
                }
            }

            // left side of screen

            if (window.outerWidth - rect.right > window.outerWidth / 2) {
                this.setState({ xPosition: outerWidth - rect.right - 320 })

                // lower side

                if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                    this.setState({ yPosition: outerHeight - rect.bottom + 40 })
                }
                // upper side
                else {
                    this.setState({ yPosition: outerHeight - rect.top + 110 })
                }
            }

            // if (window.innerHeight - rect.bottom < 400) { || window.innerHeight - rect.bottom < 400
            //     this.setState({ yPosition: rect.y - 300, xPosition: rect.x - 300 })
            // }
            //else { this.setState({ xPosition: rect.x - 35, yPosition: rect.y - 6 }) }
        }
        this.props.toggleMenu(e)
    }

    private toggleMenu: React.MouseEventHandler = (e) => {
        e.stopPropagation()

        const rect = this.buttonRef?.current?.getBoundingClientRect()
        // right side of screen

        if (window.outerWidth - rect.right < 400) {
            this.setState({ xPosition: outerWidth - rect.right })

            //lower side

            if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                this.setState({ yPosition: outerHeight - rect.bottom + 40 })
            }
            // upper side
            else {
                this.setState({ yPosition: outerHeight - rect.top + 110 })
            }
        }

        // left side of screen

        if (window.outerWidth - rect.right > window.outerWidth / 2) {
            this.setState({ xPosition: outerWidth - rect.right - 320 })

            // upper side

            if (window.outerHeight - rect.bottom > window.outerHeight / 2) {
                this.setState({ yPosition: outerHeight - rect.bottom - 40 })
            }
            // lower side
            else {
                this.setState({ yPosition: outerHeight - rect.top + 40 })
            }
        }

        return this.props.toggleMenu(e)
    }

    render() {
        return (
            <>
                <MoreIconBackground
                    onClick={this.toggleMenu}
                    ref={this.buttonRef}
                >
                    <Icon heightAndWidth="14px" path={icons.dots} />
                </MoreIconBackground>

                {this.props.isMenuDisplayed && (
                    <ClickAway onClickAway={this.toggleMenu}>
                        <SpaceContextMenu
                            ref={this.contextMenuRef}
                            {...this.props}
                            {...this.state}
                        />
                    </ClickAway>
                )}
            </>
        )
    }
}

const MoreIconBackground = styled.div`
    border-radius: 3px;
    padding: 2px;
    height: 20px;
    width: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

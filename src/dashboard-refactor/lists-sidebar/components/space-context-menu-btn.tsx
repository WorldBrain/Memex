import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SpaceContextMenu, {
    Props as SpaceContextMenuProps,
} from 'src/custom-lists/ui/space-context-menu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
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
    private spaceContextMenuButton = React.createRef<HTMLInputElement>()
    private contextMenuRef: React.RefObject<SpaceContextMenu>

    private toggleMenu = (e) => {
        e.stopPropagation()

        return this.props.toggleMenu(e)
    }

    renderContextMenu() {
        if (!this.props.isMenuDisplayed) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spaceContextMenuButton.current}
                placement={'right-start'}
                offsetX={30}
                offsetY={-10}
                closeComponent={this.toggleMenu}
                strategy={'fixed'}
                width={'300px'}
                bigClosingScreen
            >
                <SpaceContextMenu
                    ref={this.contextMenuRef}
                    {...this.props}
                    {...this.state}
                />
            </PopoutBox>
        )
    }

    render() {
        return (
            <>
                <TooltipBox
                    tooltipText={'Share & Edit'}
                    placement={'bottom'}
                    strategy={'fixed'}
                >
                    <Icon
                        onClick={this.toggleMenu}
                        heightAndWidth="14px"
                        filePath={icons.dots}
                        active={this.props.isMenuDisplayed}
                        containerRef={this.spaceContextMenuButton}
                    />
                </TooltipBox>
                {this.renderContextMenu()}
            </>
        )
    }
}

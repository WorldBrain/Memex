import React, { PureComponent } from 'react'

import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SpaceContextMenu, {
    Props as SpaceContextMenuProps,
} from 'src/custom-lists/ui/space-context-menu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

export interface Props extends Omit<SpaceContextMenuProps, 'copyToClipboard'> {
    isMenuDisplayed: boolean
    cancelListEdit: () => void
    toggleMenu: React.MouseEventHandler
}

export default class SpaceContextMenuButton extends PureComponent<Props> {
    private spaceContextMenuButton = React.createRef<HTMLInputElement>()
    private contextMenuRef: React.RefObject<SpaceContextMenu>

    private toggleMenu = (e) => {
        this.props.toggleMenu(e)
        e.stopPropagation()

        return
    }

    renderContextMenu() {
        if (!this.props.isMenuDisplayed) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spaceContextMenuButton.current}
                placement={'right-start'}
                offsetX={15}
                offsetY={-10}
                closeComponent={(e) => {
                    this.toggleMenu(e)
                    this.props.cancelListEdit()
                }}
                strategy={'fixed'}
                width={'300px'}
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
                        onClick={(e) => this.toggleMenu(e)}
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

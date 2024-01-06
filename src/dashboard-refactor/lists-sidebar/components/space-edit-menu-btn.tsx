import React, { PureComponent } from 'react'

import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SpaceEditMenu, {
    Props as SpaceEditMenuProps,
} from 'src/custom-lists/ui/space-edit-menu'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

export interface Props extends Omit<SpaceEditMenuProps, 'copyToClipboard'> {
    isMenuDisplayed: boolean
    toggleEditMenu: React.MouseEventHandler
    confirmSpaceDelete?: () => void
}

export default class SpaceEditMenuBtn extends PureComponent<Props> {
    private spaceEditMenuButton = React.createRef<HTMLInputElement>()
    private contextMenuRef: React.RefObject<SpaceEditMenu>

    private toggleEditMenu = (e) => {
        this.props.toggleEditMenu(e)
        e.stopPropagation()

        return
    }

    renderContextMenu() {
        if (!this.props.isMenuDisplayed) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spaceEditMenuButton.current}
                placement={'right-start'}
                offsetX={10}
                offsetY={-10}
                closeComponent={(e) => {
                    this.toggleEditMenu(e)
                    this.props.onCancelEdit()
                }}
                strategy={'fixed'}
                width={'300px'}
            >
                <SpaceEditMenu
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
                    tooltipText={'Edit Space'}
                    placement={'bottom'}
                    strategy={'fixed'}
                >
                    <Icon
                        onClick={(e) => this.toggleEditMenu(e)}
                        heightAndWidth="18px"
                        filePath={icons.edit}
                        active={this.props.isMenuDisplayed}
                        containerRef={this.spaceEditMenuButton}
                    />
                    {this.renderContextMenu()}
                </TooltipBox>
            </>
        )
    }
}

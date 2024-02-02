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
    toggleMenu: React.MouseEventHandler
    toggleEditMenu: React.MouseEventHandler
    isShared: boolean
    getRootElement: () => HTMLElement
}

export default class SpaceContextMenuButton extends PureComponent<Props> {
    private spaceContextMenuButton = React.createRef<HTMLInputElement>()
    private contextMenuRef: React.RefObject<SpaceContextMenu>

    private toggleMenu = (e) => {
        this.props.toggleMenu(e)
        e.stopPropagation()
        e.preventDefault()

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
                offsetX={10}
                offsetY={-10}
                closeComponent={(e) => {
                    this.toggleMenu(e)
                }}
                strategy={'fixed'}
                width={'300px'}
                getPortalRoot={this.props.getRootElement}
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
        if (this.props.isShared) {
            return (
                <>
                    <TooltipBox
                        tooltipText={'Shared Space'}
                        placement={'bottom'}
                        strategy={'fixed'}
                    >
                        <Icon
                            onClick={(e) => this.toggleMenu(e)}
                            heightAndWidth="20px"
                            filePath={icons.peopleFine}
                            color={'white'}
                            active={this.props.isMenuDisplayed}
                            containerRef={this.spaceContextMenuButton}
                        />
                    </TooltipBox>
                    {this.renderContextMenu()}
                </>
            )
        } else {
            return (
                <>
                    <TooltipBox
                        tooltipText={'Share Space'}
                        placement={'bottom'}
                        strategy={'fixed'}
                    >
                        <Icon
                            onClick={(e) => this.toggleMenu(e)}
                            heightAndWidth="18px"
                            filePath={icons.invite}
                            active={this.props.isMenuDisplayed}
                            containerRef={this.spaceContextMenuButton}
                        />
                    </TooltipBox>
                    {this.renderContextMenu()}
                </>
            )
        }
    }
}

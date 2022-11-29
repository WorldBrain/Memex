import React, { PureComponent } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ClickAway } from 'src/util/click-away-wrapper'
import SpaceContextMenu, {
    Props as SpaceContextMenuProps,
} from 'src/custom-lists/ui/space-context-menu'
import { NewHoverBox } from '@worldbrain/memex-common/lib/common-ui/components/hover-box'
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

    render() {
        return (
            <NewHoverBox
                referenceEl={this.spaceContextMenuButton.current}
                componentToOpen={
                    this.props.isMenuDisplayed ? (
                        <SpaceContextMenu
                            ref={this.contextMenuRef}
                            {...this.props}
                            {...this.state}
                        />
                    ) : null
                }
                placement={'right-start'}
                offsetX={30}
                offsetY={-10}
                closeComponent={this.toggleMenu}
                strategy={'fixed'}
                width={'300px'}
                bigClosingScreen
            >
                <Icon
                    onClick={this.toggleMenu}
                    heightAndWidth="14px"
                    filePath={icons.dots}
                    active={this.props.isMenuDisplayed}
                    ref={this.spaceContextMenuButton}
                />
            </NewHoverBox>
        )
    }
}

import React from 'react'
import browser from 'webextension-polyfill'
import styled from 'styled-components'

import { HelpMenu, Props as HelpMenuProps } from './help-menu'
import { menuItems } from '../menu-items'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

export interface Props extends HelpMenuProps {}

export interface State {
    isOpen: boolean
}

export class HelpBtn extends React.PureComponent<Props, State> {
    static defaultProps = {
        menuOptions: menuItems,
        extVersion: browser.runtime.getManifest().version,
    }

    private helpButtonRef = React.createRef<HTMLDivElement>()

    state = { isOpen: false }

    private handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault()

        this.setState((state) => ({ isOpen: !state.isOpen }))
    }

    private renderMenu() {
        if (!this.state.isOpen) {
            return null
        }

        return (
            <PopoutBox
                targetElementRef={this.helpButtonRef.current}
                placement={'top-end'}
                offsetX={10}
                closeComponent={() =>
                    this.setState((state) => ({ isOpen: !state.isOpen }))
                }
            >
                <HelpMenu {...this.props} />
            </PopoutBox>
        )
    }

    render() {
        return (
            <HelpIconPosition>
                {this.renderMenu()}
                <Icon
                    filePath={icons.helpIcon}
                    heightAndWidth={'34px'}
                    onClick={this.handleClick}
                    containerRef={this.helpButtonRef}
                />
            </HelpIconPosition>
        )
    }
}

const HelpIconPosition = styled.div`
    display: flex;
    justify-content: space-between;
    height: fit-content;
    width: fit-content;
    position: fixed;
    bottom: 10px;
    right: 10px;
    z-index: 100;

    @media (max-width: 1100px) {
        display: none;
    }
`

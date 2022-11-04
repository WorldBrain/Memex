import React from 'react'
import browser from 'webextension-polyfill'
import styled from 'styled-components'

import { HelpMenu, Props as HelpMenuProps } from './help-menu'
import { menuItems } from '../menu-items'
import { ClickAway } from 'src/util/click-away-wrapper'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends HelpMenuProps {}

export interface State {
    isOpen: boolean
}

export class HelpBtn extends React.PureComponent<Props, State> {
    static defaultProps = {
        menuOptions: menuItems,
        extVersion: browser.runtime.getManifest().version,
    }

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
            <ClickAway
                onClickAway={() =>
                    this.setState((state) => ({ isOpen: !state.isOpen }))
                }
            >
                <HelpMenu {...this.props} />
            </ClickAway>
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
    position: absolute;
    bottom: 10px;
    right: 10px;

    @media (max-width: 1100px) {
        display: none;
    }
`

import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { ClickAway } from 'src/util/click-away-wrapper'

export interface MenuItemProps {
    name: string
    isDisabled?: boolean
}

interface ThemeProps {
    leftMenuOffset?: string
}

export interface Props<T extends MenuItemProps = MenuItemProps> {
    menuItems: T[]
    btnChildren: React.ReactNode
    onMenuItemClick: (itemProps: T) => void
    theme?: ThemeProps
}

interface State {
    isOpen: boolean
}

export class DropdownMenuBtn extends React.PureComponent<Props, State> {
    state: State = { isOpen: false }
    private lastToggleCall = 0

    private get theme() {
        return {
            ...this.props.theme,
            isMenuOpen: this.state.isOpen,
        }
    }

    private toggleMenu = () => {
        // This check covers the case when the menu is open and you click the button to close it:
        //  This case triggers the "ClickAway" event calling this method AND the btn's call,
        //  which results in flickering between the 2 states
        const now = Date.now()
        if (now - this.lastToggleCall < 100) {
            return
        }
        this.lastToggleCall = now

        this.setState((state) => ({ isOpen: !state.isOpen }))
    }

    private handleItemClick: (
        props: MenuItemProps,
    ) => React.MouseEventHandler = (props) => (e) => {
        if (props.isDisabled) {
            e.preventDefault()
            return
        }

        this.toggleMenu()
        this.props.onMenuItemClick(props)
    }

    private renderMenuItems = () =>
        this.props.menuItems.map((props, i) => (
            <MenuItem
                key={i}
                onClick={this.handleItemClick(props)}
                theme={{ isDisabled: props.isDisabled }}
            >
                {props.name}
            </MenuItem>
        ))

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <MenuContainer>
                    <MenuBtn onClick={this.toggleMenu}>
                        {this.props.btnChildren}
                    </MenuBtn>
                    {this.state.isOpen && (
                        <ClickAway onClickAway={this.toggleMenu}>
                            <Menu>{this.renderMenuItems()}</Menu>
                        </ClickAway>
                    )}
                </MenuContainer>
            </ThemeProvider>
        )
    }
}

const MenuContainer = styled.div`
    position: relative;
    flex: 1;
`

const MenuItem = styled.li`
    ${({ theme }) =>
        theme.isDisabled
            ? 'color: #97b2b8;'
            : '&:hover { background: #97b2b8; cursor: pointer; }'}
    padding: 10px 20px;
`

const MenuBtn = styled.button`
    font-weight: ${({ theme }) => (theme.isMenuOpen ? 'bold' : 'normal')};
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    margin: 5px 5px -5px 0;
    background: transparent;
    border-radius: 3px;

    &:focus {
        background-color: grey;
    }

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const Menu = styled.ul`
    position: absolute;
    ${({ theme }) => `left: ${theme.leftMenuOffset ?? 0};`}
    list-style: none;
    padding: 10px 0;
    background: white;
    border: black 1px solid;
    border-radius: 5px;
`

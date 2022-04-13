import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { ClickAway } from 'src/util/click-away-wrapper'
import ButtonTooltip, { Props as ButtonTooltipProps } from './button-tooltip'

export interface MenuItemProps {
    name: string
    id?: string | number
    info?: string
    isDisabled?: boolean
    soonAvailable?: boolean
}

interface ThemeProps {
    leftMenuOffset?: string
}

export interface Props<T extends MenuItemProps = MenuItemProps> {
    isOpen?: boolean
    toggleOpen?: () => void
    menuItems: T[]
    btnChildren: React.ReactNode
    onMenuItemClick?: (itemProps: T) => void
    theme?: ThemeProps
    keepSelectedState?: boolean
    tooltipProps?: ButtonTooltipProps
    initSelectedIndex?: number
    btnId?: string
    menuTitle?: string
    width?: string
    onClickOutside?: React.MouseEventHandler
}

interface State {
    isOpen: boolean
    selected: number
}

export class DropdownMenuBtn extends React.PureComponent<Props, State> {
    static defaultProps: Partial<Props> = { initSelectedIndex: 0 }

    state: State = {
        isOpen: false,
        selected: this.props.keepSelectedState
            ? this.props.initSelectedIndex
            : -1,
    }

    private lastToggleCall = 0

    private get theme() {
        return {
            ...this.props.theme,
            isMenuOpen: this.state.isOpen,
        }
    }

    private get isOpen(): boolean {
        return this.props.isOpen ?? this.state.isOpen
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

        if (this.props.toggleOpen) {
            this.props.toggleOpen()
        } else {
            this.setState((state) => ({ isOpen: !state.isOpen }))
        }
    }

    private handleItemClick: (
        props: MenuItemProps,
        index: number,
    ) => React.MouseEventHandler = (props, index) => (e) => {
        if (props.isDisabled) {
            e.preventDefault()
            return
        }

        this.setState({ isOpen: this.props.keepSelectedState, selected: index })
        this.props.onMenuItemClick(props)
    }

    private renderMenuItems = () =>
        this.props.menuItems.map((props, i) => (
            <MenuItem
                key={i}
                onClick={this.handleItemClick(props, i)}
                theme={{
                    isDisabled: props.isDisabled,
                    isSelected: this.props.keepSelectedState
                        ? this.state.selected === i
                        : false,
                }}
            >
                <MenuItemName isSelected={this.state.selected === i}>
                    {props.name}
                    {props.isDisabled && props.soonAvailable && (
                        <SoonPill>Coming Soon</SoonPill>
                    )}
                </MenuItemName>
                {props.info && <MenuItemInfo>{props.info}</MenuItemInfo>}
            </MenuItem>
        ))

    // private renderMenuBtn = () => {
    //     const btn = (
    //         <MenuBtn
    //             isOpen={this.state.isOpen}
    //             id={this.props.btnId}
    //             onClick={this.toggleMenu}
    //         >
    //             {this.props.btnChildren}
    //         </MenuBtn>
    //     )

    //     if (this.props.tooltipProps) {
    //         return (
    //             <ButtonTooltip {...this.props.tooltipProps}>
    //                 {btn}
    //             </ButtonTooltip>
    //         )
    //     }

    //     return btn
    // }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <ClickAway onClickAway={this.props.onClickOutside}>
                    <Menu
                        onMouseEnter={(e) => {
                            e.preventDefault()
                            e.stopPropagation
                        }}
                        onMouseLeave={(e) => {
                            e.preventDefault()
                            e.stopPropagation
                        }}
                        width={this.props.width}
                        leftPosition={this.theme.leftMenuOffset}
                    >
                        {this.props.menuTitle && (
                            <MenuTitle>{this.props.menuTitle}</MenuTitle>
                        )}
                        {this.props.children ?? this.renderMenuItems()}
                    </Menu>
                </ClickAway>
            </ThemeProvider>
        )
    }
}

const MenuContainer = styled.div`
    position: relative;
    flex: 1;
    align-items: center;
    display: flex;
    width: 100%;
    height: 100%;
`

const MenuItem = styled.li`
    ${({ theme }) =>
        theme.isDisabled
            ? 'color: #97b2b8;'
            : '&:hover { background: #F8FBFF; cursor: pointer; }'};
    ${({ theme }) => theme.isSelected && 'background: #e5f0ff80;'};
    padding: 10px 10px;
    line-height: 20px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    border-radius: 5px;
`

const MenuTitle = styled.div`
    padding: 8px 15px 0px 15px;
    margin-bottom: 10px;
`

const SoonPill = styled.span`
    background: ${(props) => props.theme.colors.purple};
    color: #fff;
    padding: 2px 5px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 5px;
    font-size: 10px;
`

const MenuItemName = styled.div<{ isSelected }>`
    font-weight: ${(props) => (props.isSelected ? '500' : '400')};
    color: ${(props) => (props.isSelected ? '#347AE2' : '#96A0B5')};
    font-size: 14px;
    display: flex;
    align-items: center;
`

const MenuItemInfo = styled.div`
    font-weight: 400;
    font-size: 14px;
    padding-top: 5px;
`

const MenuBtn = styled.div<{ isOpen: boolean }>`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
`

const Menu = styled.div<{ leftPosition: string }>`
    position: absolute;
    width: max-content;
    list-style: none;
    background: white;
    border-radius: 8px;
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    background: white;
    width: ${(props) => props.width ?? 'max-content'};
    flex-direction: column;
    top: 25px;
    left: ${(props) => props.leftPosition};
    z-index: 1000;
    padding: 10px;
`

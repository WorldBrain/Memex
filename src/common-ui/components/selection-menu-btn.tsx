import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

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
    btnChildren?: React.ReactNode
    onMenuItemClick?: (itemProps: T) => void
    theme?: ThemeProps
    keepSelectedState?: boolean
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

export class SelectionMenuBtn extends React.PureComponent<Props, State> {
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
                isSelected={this.state.selected === i}
            >
                <MenuItemName isSelected={this.state.selected === i}>
                    {props.name}
                    {this.state.selected === i && (
                        <Icon
                            filePath="check"
                            color="prime1"
                            heightAndWidth="18px"
                            hoverOff
                        />
                    )}
                </MenuItemName>
                {props.info && <MenuItemInfo>{props.info}</MenuItemInfo>}
            </MenuItem>
        ))

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <Menu
                    onMouseEnter={(e) => {
                        e.preventDefault()
                        e.stopPropagation
                    }}
                    onMouseLeave={(e) => {
                        e.preventDefault()
                        e.stopPropagation
                    }}
                >
                    {this.props.menuTitle && (
                        <MenuTitle>{this.props.menuTitle}</MenuTitle>
                    )}
                    {this.props.children ?? this.renderMenuItems()}
                </Menu>
            </ThemeProvider>
        )
    }
}

const MenuItem = styled.div<{ isSelected }>`
    background: ${(props) => props.isSelected && props.theme.colors.greyScale2};
    padding: 10px 10px;
    line-height: 20px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    border-radius: 6px;
    margin: 0 10px;
    cursor: ${(props) => !props.isSelected && 'pointer'};
    width: 210px;

    &:first-child {
        margin-top: 10px;
    }

    &:last-child {
        margin-bottom: 10px;
    }

    ${(props) =>
        !props.isSelected &&
        css`
            cursor: pointer;

            &:hover {
                outline: 1px solid ${(props) => props.theme.colors.greyScale3};
            }

            & * {
                cursor: pointer;
            }
        `};
`

const MenuTitle = styled.div`
    padding: 8px 15px 0px 15px;
    margin-bottom: 10px;
    font-size: 14px;
`

const MenuItemName = styled.div<{ isSelected }>`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    display: flex;
    align-items: center;
    grid-gap: 5px;
    justify-content: space-between;
    width: -webkit-fill-available;
    height: 24px;
`

const MenuItemInfo = styled.div`
    font-weight: 400;
    font-size: 14px;
    padding-top: 5px;
`

const Menu = styled.div`
    width: max-content;
    list-style: none;
    border-radius: 12px;
    flex-direction: column;
    z-index: 1000;
`

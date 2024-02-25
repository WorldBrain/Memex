import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

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
    onMenuItemClick?: (itemProps: T, index?) => void
    theme?: ThemeProps
    keepSelectedState?: boolean
    initSelectedIndex?: number
    btnId?: string
    menuTitle?: string
    width?: string
    backgroundColor?: string
    elementHeight?: string
}

interface State {
    isOpen: boolean
    selected: number
    isOpened: boolean
}

export class DropdownMenuBtn extends React.PureComponent<Props, State> {
    static defaultProps: Partial<Props> = { initSelectedIndex: 0 }

    state: State = {
        isOpen: false,
        selected: this.props.keepSelectedState
            ? this.props.initSelectedIndex
            : -1,
        isOpened: false,
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
        this.setState({
            isOpen: this.props.keepSelectedState,
            selected: index,
            isOpened: false,
        })
        this.props.onMenuItemClick(props, index)
    }

    private renderMenuItems() {
        const selectedMenuItem = this.props.menuItems[this.state.selected]
        if (!this.state.isOpened) {
            return (
                <MenuItem
                    key={this.state.selected}
                    onClick={() => {
                        this.setState({
                            isOpened: true,
                        })
                    }}
                    isSelected={true}
                    backgroundColor={this.props.backgroundColor}
                    elementHeight={this.props.elementHeight}
                    isOpened={this.state.isOpened}
                >
                    <MenuItemName isSelected={true}>
                        <MenuItemBox>
                            {selectedMenuItem.name}
                            {selectedMenuItem.info && (
                                <MenuItemInfo>
                                    {selectedMenuItem.info}
                                </MenuItemInfo>
                            )}
                        </MenuItemBox>
                        <Icon
                            filePath="arrowDown"
                            color="greyScale7"
                            heightAndWidth="18px"
                            hoverOff
                        />
                    </MenuItemName>
                </MenuItem>
            )
        } else {
            return (
                <MenuItemContainerUnfolded isOpen={this.state.isOpened}>
                    {this.props.menuItems.map((props, i) => (
                        <MenuItem
                            key={i}
                            onClick={this.handleItemClick(props, i)}
                            isSelected={this.state.selected === i}
                            backgroundColor={this.props.backgroundColor}
                            elementHeight={this.props.elementHeight}
                            isOpened={this.state.isOpened}
                        >
                            <MenuItemName
                                isSelected={this.state.selected === i}
                            >
                                <MenuItemBox>
                                    <MenuItemName
                                        isSelected={this.state.selected === i}
                                    >
                                        {props.name}
                                    </MenuItemName>
                                    {props.info && (
                                        <MenuItemInfo>
                                            {props.info}
                                        </MenuItemInfo>
                                    )}
                                </MenuItemBox>
                                {this.state.selected === i && (
                                    <Icon
                                        filePath="check"
                                        color="prime1"
                                        heightAndWidth="18px"
                                        hoverOff
                                    />
                                )}
                            </MenuItemName>
                        </MenuItem>
                    ))}
                </MenuItemContainerUnfolded>
            )
        }
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <Menu
                    elementHeight={this.props.elementHeight}
                    onMouseEnter={(e) => {
                        e.preventDefault()
                        e.stopPropagation
                    }}
                    onMouseLeave={(e) => {
                        e.preventDefault()
                        e.stopPropagation
                    }}
                    width={this.props.width}
                    isOpen={this.state.isOpened}
                >
                    {this.props.children ?? this.renderMenuItems()}
                </Menu>
            </ThemeProvider>
        )
    }
}

const MenuItemBox = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    grid-gap: 5px;
`

const MenuItem = styled.div<{
    isSelected
    backgroundColor
    elementHeight: string
    isOpened: boolean
}>`
    background: ${(props) =>
        props.backgroundColor && props.theme.colors[props.backgroundColor]};
    padding: 0px 10px 0px 15px;
    line-height: 20px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    white-space: nowrap;
    border-radius: 6px;
    cursor: pointer;
    height: ${(props) => (props.elementHeight ? props.elementHeight : '60px')};

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
    ${(props) =>
        !props.isOpened &&
        css`
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
`

const MenuItemInfo = styled.div`
    font-weight: 400;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
`

const Menu = styled.div<{
    isOpen: boolean
    elementHeight: string
    width: string
}>`
    list-style: none;
    border-radius: 6px;
    width: ${(props) => props.width ?? 'max-content'};
    flex-direction: column;
    z-index: 1000;
    width: 100%;
    position: relative;
    height: ${(props) => props.elementHeight ?? '60px'};
    overflow: visible;
    margin-bottom: 10px;
`

const MenuItemContainerUnfolded = styled.div<{
    isOpen: boolean
}>`
    display: flex;
    position: absolute;
    flex-direction: column;
    width: 100%;
    border-radius: 6px;
    background: ${(props) => props.theme.colors.greyScale2};

    ${(props) =>
        props.isOpen &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        `}
`

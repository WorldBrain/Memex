import React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { AImodels } from '@worldbrain/memex-common/lib/summarization/types'

export interface MenuItemProps {
    name: string
    id?: AImodels
    info?: string | JSX.Element
    isDisabled?: boolean
    soonAvailable?: boolean
}

interface ThemeProps {
    leftMenuOffset?: string
}

export interface Props<T extends MenuItemProps = MenuItemProps> {
    isOpen?: boolean
    toggleOpen?: () => void
    menuItems: MenuItemProps[]
    btnChildren?: React.ReactNode
    onMenuItemClick?: (item: T) => void
    theme?: ThemeProps
    keepSelectedState?: boolean
    initSelectedItem?: string
    selectedState?: string
    btnId?: string
    menuTitle?: string
    width?: string
    backgroundColor?: string
    elementHeight?: string
    hideDescriptionInPreview: boolean
    getRootElement: () => HTMLElement
    renderAICounter?: () => JSX.Element
}

interface State {
    isOpen: boolean
    selected: MenuItemProps
    isOpened: boolean
}

export class DropdownMenuBtn extends React.PureComponent<Props, State> {
    static defaultProps: Partial<Props> = { initSelectedItem: null }

    private menuRef = React.createRef<HTMLDivElement>()

    state: State = {
        isOpen: false,
        selected:
            this.props.menuItems.find(
                (item) => item.id === this.props.initSelectedItem,
            ) || this.props.menuItems[0],
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
        item: MenuItemProps,
    ) => React.MouseEventHandler = (item) => (e) => {
        if (item.isDisabled) {
            e.preventDefault()
            return
        }
        this.setState({
            isOpen: this.props.keepSelectedState,
            selected: item,
            isOpened: false,
        })
        this.props.onMenuItemClick(item)
    }

    private renderMenuItems() {
        // if (this.props.selectedState === 1) {
        //     this.setState({
        //         selected: 1,
        //     })
        // }

        return (
            <MenuItemContainerUnfolded isOpen={this.state.isOpened}>
                {this.props.menuItems.map((item) => (
                    <MenuItem
                        onClick={this.handleItemClick(item)}
                        isSelected={this.state.selected.id === item.id}
                        backgroundColor={this.props.backgroundColor}
                        elementHeight={this.props.elementHeight}
                        isOpened={this.state.isOpened}
                        isDisabled={item.isDisabled}
                    >
                        <MenuItemName
                            isSelected={this.state.selected.id === item.id}
                            isOpened={this.state.isOpened}
                        >
                            <MenuItemBox isOpened={this.state.isOpened}>
                                <MenuItemName
                                    isSelected={
                                        this.state.selected.id === item.id
                                    }
                                    isOpened={this.state.isOpened}
                                >
                                    {item.name}
                                </MenuItemName>
                                {item.info && (
                                    <MenuItemInfo isDisabled={item.isDisabled}>
                                        {item.info}
                                    </MenuItemInfo>
                                )}
                            </MenuItemBox>
                            {this.state.selected.id === item.id && (
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
                {this.props.renderAICounter()}
            </MenuItemContainerUnfolded>
        )
    }

    renderPopoutMenu() {
        if (this.state.isOpened) {
            return (
                <PopoutBox
                    targetElementRef={this.menuRef.current}
                    closeComponent={() => this.setState({ isOpened: false })}
                    placement="bottom-end"
                    width={this.props.width ?? '290px'}
                    getPortalRoot={this.props.getRootElement}
                    offsetX={15}
                >
                    {this.props.children ?? this.renderMenuItems()}
                </PopoutBox>
            )
        }
    }

    render() {
        const selectedMenuItem = this.props.menuItems.find(
            (item) =>
                item.id ===
                (this.state.selected.id || this.props.selectedState),
        )

        return (
            <ThemeProvider theme={this.theme}>
                <Menu
                    elementHeight={this.props.elementHeight}
                    ref={this.menuRef}
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
                    {' '}
                    <MenuItem
                        onClick={() => {
                            this.setState({
                                isOpened: true,
                            })
                        }}
                        isSelected={true}
                        backgroundColor={this.props.backgroundColor}
                        elementHeight={this.props.elementHeight}
                        isOpened={this.state.isOpened}
                        isDisabled={selectedMenuItem.isDisabled}
                    >
                        <MenuItemButton
                            isOpened={this.state.isOpened}
                            isSelected={true}
                        >
                            <MenuItemBox isOpened={false}>
                                {selectedMenuItem.name}
                            </MenuItemBox>
                            <Icon
                                filePath="arrowDown"
                                color="greyScale6"
                                heightAndWidth="18px"
                                hoverOff
                                padding={'0px'}
                            />
                        </MenuItemButton>
                    </MenuItem>
                    {this.renderPopoutMenu()}
                </Menu>
            </ThemeProvider>
        )
    }
}

const MenuItemBox = styled.div<{ isOpened }>`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-direction: column;
    grid-gap: 5px;
    color: ${(props) =>
        !props.isOpened
            ? props.theme.colors.greyScale6
            : props.theme.colors.white};
`

const MenuItem = styled.div<{
    isSelected
    backgroundColor
    elementHeight: string
    isOpened: boolean
    isDisabled: boolean
}>`
    background: ${(props) =>
        props.backgroundColor && props.theme.colors[props.backgroundColor]};
    line-height: 20px;
    width: fill-available;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    white-space: nowrap;
    border-radius: 6px;
    cursor: pointer;
    height: ${(props) =>
        props.elementHeight && props.isOpened ? props.elementHeight : '20px'};

    ${(props) =>
        !props.isSelected &&
        css`
            cursor: pointer;

            & * {
                cursor: pointer;
            }
        `};
    ${(props) =>
        !props.isOpened &&
        css`
            & * {
                cursor: pointer;
            }
        `};
    ${(props) =>
        props.isDisabled &&
        css`
            cursor: not-allowed;
            opacity: 0.8;

            * {
                cursor: not-allowed;
                opacity: 0.9;
            }
        `};
`

const MenuTitle = styled.div`
    padding: 8px 15px 0px 15px;
    margin-bottom: 10px;
    font-size: 14px;
`

const MenuItemName = styled.div<{ isSelected: boolean; isOpened: boolean }>`
    color: ${(props) =>
        props.isOpened
            ? props.theme.colors.greyScale6
            : props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 400;
    display: flex;
    align-items: center;
    grid-gap: 5px;
    justify-content: 'space-between';
    width: -webkit-fill-available;

    ${(props) =>
        props.isOpened &&
        css`
            font-size: 14px;
        `}
`
const MenuItemButton = styled.div<{ isSelected: boolean; isOpened: boolean }>`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 12px;
    font-weight: 400;
    display: flex;
    align-items: center;
    width: fill-available;
    width: -moz-available;
    grid-gap: 5px;
    justify-content: center;
    width: -webkit-fill-available;
`

const MenuItemInfo = styled.div<{
    isDisabled: boolean
}>`
    font-weight: 300;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale5};
    ${(props) =>
        props.isDisabled &&
        css`
            color: ${(props) => props.theme.colors.greyScale7};
        `}
`

const Menu = styled.div<{
    isOpen: boolean
    elementHeight: string
    width: string
}>`
    list-style: none;
    border-radius: 10px;
    width: ${(props) => props.width ?? 'max-content'};
    flex-direction: column;
    z-index: 1000;
    position: relative;
    grid-gap: 5px;
    overflow: visible;
    height: fill-available;
    height: -moz-available;
    width: fill-available;
    width: -moz-available;
    display: flex;
    align-items: center;
    justify-content: center;
`

const MenuItemContainerUnfolded = styled.div<{
    isOpen: boolean
}>`
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    background: ${(props) => props.theme.colors.greyScale2};
    padding: 15px;
    width: fill-available;
    grid-gap: 10px;
`

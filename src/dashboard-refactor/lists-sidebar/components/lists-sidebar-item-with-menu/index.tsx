import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'

import { Icon } from '../../../styled-components'
import UnstyledListsSidebarItem from '../lists-sidebar-item'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ListsSidebarItemProps } from '../lists-sidebar-item/types'

const Container = styled.div`
    position: relative;
`

const ListsSidebarItem = styled(UnstyledListsSidebarItem)`
    width: 173px;
`

const MenuContainer = styled.div`
    width: min-content;
    position: absolute;
    left: 175px;
    top: 0px;
    background-color: #ffffff;
    box-shadow: ${styles.components.dropDown.boxShadow};
    border-radius: ${styles.components.dropDown.borderRadius};
    ${(props) =>
        css`
            display: ${props.isDisplayed
                ? `flex; flex-direction: column`
                : `none`};
        `};
`

const MenuButton = styled.div`
    height: 34px;
    min-width: 102px;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 12px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    cursor: pointer;

    &:hover {
        background-color: ${colors.onHover};
    }
`

export interface ListsSidebarItemWithMenuProps {
    listId: string
    listsSidebarItemProps: ListsSidebarItemProps
    listsSidebarItemActionsArray?: Array<ListsSidebarItemActionItem>
    isMenuDisplayed?: boolean
}

export interface ListsSidebarItemActionItem {
    label: string
    iconPath: string
    onClick(normalizedPageUrl: string): void
}

export default class ListsSidebarItemWithMenu extends PureComponent<
    ListsSidebarItemWithMenuProps
> {
    render() {
        const {
            listsSidebarItemProps: {
                className,
                listName,
                isEditing,
                selectedState,
                hoverState,
                dropReceivingState,
                newItemsCountState,
                moreActionButtonState,
            },
            listsSidebarItemActionsArray,
            isMenuDisplayed,
            listId,
        } = this.props
        return (
            <Container>
                <ListsSidebarItem
                    className={className}
                    listName={listName}
                    isEditing={isEditing}
                    hoverState={{
                        onHoverEnter() {
                            hoverState.onHoverEnter(listId)
                        },
                        onHoverLeave() {
                            hoverState.onHoverLeave(listId)
                        },
                        ...hoverState,
                    }}
                    selectedState={{
                        onSelected() {
                            selectedState.onSelection(listId)
                        },
                        ...selectedState,
                    }}
                    dropReceivingState={{
                        onDragOver() {
                            dropReceivingState.onDragOver(listId)
                        },
                        onDragLeave() {
                            dropReceivingState.onDragLeave(listId)
                        },
                        ...dropReceivingState,
                    }}
                    newItemsCountState={newItemsCountState}
                    moreActionButtonState={{
                        onMoreActionClick() {
                            moreActionButtonState.onMoreActionClick(listId)
                        },
                        ...moreActionButtonState,
                    }}
                />
                <MenuContainer isDisplayed={isMenuDisplayed}>
                    {listsSidebarItemActionsArray &&
                        listsSidebarItemActionsArray.map((item, idx) => {
                            const { label, iconPath, onClick } = item
                            return (
                                <MenuButton key={idx} onClick={onClick}>
                                    <Margin horizontal="10px">
                                        <Icon
                                            heightAndWidth="12px"
                                            path={iconPath}
                                        />
                                    </Margin>
                                    {label}
                                </MenuButton>
                            )
                        })}
                </MenuContainer>
            </Container>
        )
    }
}

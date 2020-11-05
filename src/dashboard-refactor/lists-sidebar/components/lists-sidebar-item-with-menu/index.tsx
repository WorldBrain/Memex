import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'

import styleConstants, { fonts } from 'src/dashboard-refactor/styleConstants'
import colors from 'src/dashboard-refactor/colors'

import UnstyledListsSidebarItem, {
    ListsSidebarItemProps,
} from '../lists-sidebar-item'
import { Icon } from '../../../styledComponents'
import Margin from 'src/dashboard-refactor/components/Margin'

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
    box-shadow: ${styleConstants.components.dropDown.boxShadow};
    border-radius: ${styleConstants.components.dropDown.borderRadius};
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
    listsSidebarItemActionsArray: Array<ListsSidebarItemActionItem>
    isDisplayed: boolean
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
                droppableState,
                newItemsCountState,
                moreActionButtonState,
            },
            listsSidebarItemActionsArray,
            isDisplayed,
            listId,
        } = this.props
        return (
            <Container>
                <ListsSidebarItem
                    className={className}
                    listName={listName}
                    isEditing={isEditing}
                    newItemsCountState={newItemsCountState}
                    selectedState={{
                        onSelected: selectedState.onSelection(listId),
                        ...selectedState,
                    }}
                    hoverState={{
                        onHoverEnter: hoverState.onHoverEnter(listId),
                        onHoverLeave: hoverState.onHoverLeave(listId),
                        ...hoverState,
                    }}
                    droppableState={{
                        onDragOver: droppableState.onDragOver(listId),
                        onDragLeave: droppableState.onDragLeave(listId),
                        ...droppableState,
                    }}
                    moreActionButtonState={{
                        onMoreActionClick: moreActionButtonState.onMoreActionClick(
                            listId,
                        ),
                        ...moreActionButtonState,
                    }}
                />
                <MenuContainer isDisplayed={isDisplayed}>
                    {listsSidebarItemActionsArray.map((item, idx) => {
                        const { label, iconPath, onClick } = item
                        return (
                            <MenuButton key={idx} onClick={onClick}>
                                <Margin x="10px">
                                    <Icon path={iconPath} />
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

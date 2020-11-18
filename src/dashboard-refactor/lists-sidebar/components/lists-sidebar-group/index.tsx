import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import styles from 'src/dashboard-refactor/styleConstants'
import { Icon } from 'src/dashboard-refactor/styledComponents'
import {
    AddableState,
    ExpandableState,
    ListSource,
} from 'src/dashboard-refactor/types'
import styled from 'styled-components'

import { TaskState } from 'ui-logic-core/lib/types'
import ListsSidebarItemWithMenu, {
    ListsSidebarItemWithMenuProps,
} from '../lists-sidebar-item-with-menu'
import { LoadingIndicator } from 'src/common-ui/components'

const { fonts } = styles

const expandIconWidthPx = 8
const expandIconMarginWidthPx = 5.5 * 2
const addIconWidthPx = 12
const addIconMarginWidthPx = 8 * 2

const containerWidthPx = styles.components.sidebar.widthPx

const Container = styled.div`
    width: ${containerWidthPx};
    position: relative;
`

const GroupHeaderContainer = styled.div`
    height: 27px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: start;
`

const GroupHeaderInnerDiv = styled.div`
    width: 100%
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const GroupTitle = styled.p`
    colors: ${fonts.primary.colors.secondary}
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    font-size: 12px;
    line-height: 18px;

    width: ${
        containerWidthPx -
        expandIconWidthPx -
        expandIconMarginWidthPx -
        addIconWidthPx -
        addIconMarginWidthPx
    }px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

const IconContainer = styled.div`
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
`

const LoadingContainer = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

export interface ListsSidebarGroupProps {
    hasTitle: boolean
    listsGroupTitle?: string
    listSource?: ListSource
    listsArray: Array<ListsSidebarItemsArrayObject>
    addableState: AddableState
    expandableState: ExpandableState
    taskState: TaskState
}

export interface ListsSidebarItemsArrayObject {
    listId: string
    listsSidebarItemWithMenuProps: ListsSidebarItemWithMenuProps
}

export default class ListsSidebarGroup extends PureComponent<
    ListsSidebarGroupProps
> {
    handleExpandClick = function () {
        this.props.expandableState.onExpand(this.props.listSource)
    }
    handleAddButtonClick = function () {
        this.props.addableState.onAdd(this.props.listSource)
    }
    renderErrorState = function () {
        return <div>Error! Oh Noes!</div>
    }
    renderLoadingState = function () {
        return (
            <LoadingContainer y="15px">
                <LoadingIndicator />
            </LoadingContainer>
        )
    }
    renderLists = () => {
        const {
            expandableState: { isExpanded },
            listsArray,
        } = this.props
        if (!isExpanded) return <div></div>
        return listsArray.map((listObj, idx) => {
            const {
                listsSidebarItemWithMenuProps: {
                    listsSidebarItemActionsArray,
                    listsSidebarItemProps,
                    isMenuDisplayed,
                },
                listId,
            } = listObj
            return (
                <ListsSidebarItemWithMenu
                    key={idx}
                    listId={listId}
                    isMenuDisplayed={isMenuDisplayed}
                    listsSidebarItemProps={listsSidebarItemProps}
                    listsSidebarItemActionsArray={
                        listsSidebarItemActionsArray &&
                        listsSidebarItemActionsArray.map((actionsObj) => {
                            return {
                                onClick: actionsObj.onClick(listId),
                                ...actionsObj,
                            }
                        })
                    }
                />
            )
        })
    }
    render() {
        const {
            taskState,
            listsGroupTitle,
            hasTitle,
            expandableState: { isExpanded, isExpandable },
        } = this.props
        return (
            <Container>
                {hasTitle && (
                    <GroupHeaderContainer>
                        {isExpandable && (
                            <IconContainer onClick={this.handleExpandClick}>
                                <Margin x="5.5px">
                                    <Icon
                                        plus90={isExpanded}
                                        minus90={!isExpanded}
                                        xy="8px"
                                        path="/img/triangleSmall.svg"
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <GroupHeaderInnerDiv className="inner">
                            <GroupTitle>{listsGroupTitle}</GroupTitle>
                            <IconContainer onClick={this.handleAddButtonClick}>
                                <Margin x="8px">
                                    <Icon xy="12px" path="/img/plus.svg" />
                                </Margin>
                            </IconContainer>
                        </GroupHeaderInnerDiv>
                    </GroupHeaderContainer>
                )}
                {taskState === 'running' && this.renderLoadingState()}
                {taskState === 'error' && this.renderErrorState()}
                {taskState === 'success' && this.renderLists()}
            </Container>
        )
    }
}

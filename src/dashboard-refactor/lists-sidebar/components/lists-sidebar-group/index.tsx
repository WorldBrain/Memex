import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import styles from 'src/dashboard-refactor/styles'
import {
    Icon,
    LoadingContainer,
    LoadingIndicator,
} from 'src/dashboard-refactor/styled-components'
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
import * as icons from 'src/common-ui/components/design-library/icons'

const { fonts } = styles

const Container = styled.div`
    width: 100%;
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
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const GroupTitle = styled.div`
    color: ${fonts.primary.colors.secondary};
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.bold};
    font-size: 12px;
    line-height: 18px;

    width: max-content;
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

export interface ListsSidebarGroupProps {
    hasTitle: boolean
    listsGroupTitle?: string
    listSource?: ListSource
    listsArray: Array<ListsSidebarItemsArrayObject>
    addableState: AddableState
    expandableState: ExpandableState
    loadingState: TaskState
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
            <Margin vertical="15px">
                <LoadingContainer>
                    <LoadingIndicator backgroundColor="#e1e1e1" />
                </LoadingContainer>
            </Margin>
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
            loadingState,
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
                                <Margin horizontal="5.5px">
                                    <Icon
                                        plus90={isExpanded}
                                        minus90={!isExpanded}
                                        heightAndWidth="8px"
                                        path={icons.triangle}
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <GroupHeaderInnerDiv className="inner">
                            <GroupTitle>{listsGroupTitle}</GroupTitle>
                            <IconContainer onClick={this.handleAddButtonClick}>
                                <Margin horizontal="8px">
                                    <Icon
                                        heightAndWidth="12px"
                                        path={icons.plus}
                                    />
                                </Margin>
                            </IconContainer>
                        </GroupHeaderInnerDiv>
                    </GroupHeaderContainer>
                )}
                {loadingState === 'running' && this.renderLoadingState()}
                {loadingState === 'error' && this.renderErrorState()}
                {loadingState === 'success' && this.renderLists()}
            </Container>
        )
    }
}

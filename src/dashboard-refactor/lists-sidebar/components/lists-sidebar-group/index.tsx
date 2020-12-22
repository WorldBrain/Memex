import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import styles from 'src/dashboard-refactor/styles'
import {
    Icon,
    LoadingContainer,
    LoadingIndicator,
} from 'src/dashboard-refactor/styled-components'
import styled from 'styled-components'

import { TaskState } from 'ui-logic-core/lib/types'
import ListsSidebarItemWithMenu, {
    Props,
} from '../lists-sidebar-item-with-menu'
import * as icons from 'src/common-ui/components/design-library/icons'
import ListsSidebarEditableItem from '../lists-sidebar-editable-item'

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
    title?: string
    isExpanded: boolean
    isAddInputShown?: boolean
    loadingState: TaskState
    confirmAddNewList?: (name: string) => void
    cancelAddNewList?: (name: string) => void
    onAddBtnClick?: React.MouseEventHandler
    onExpandBtnClick?: React.MouseEventHandler
    listsArray: Props[]
}

export interface ListsSidebarItemsArrayObject {
    listId: string
    listsSidebarItemWithMenuProps: Props
}

export default class ListsSidebarGroup extends PureComponent<
    ListsSidebarGroupProps
> {
    private renderErrorState = function () {
        return <div>Error! Oh Noes!</div>
    }

    private renderLoadingState = function () {
        return (
            <Margin vertical="15px">
                <LoadingContainer>
                    <LoadingIndicator backgroundColor="#e1e1e1" />
                </LoadingContainer>
            </Margin>
        )
    }

    private renderLists = () => {
        if (!this.props.isExpanded) {
            return null
        }

        if (this.props.loadingState === 'running') {
            return this.renderLoadingState()
        }

        if (this.props.loadingState === 'error') {
            this.renderErrorState()
        }

        const listItems = this.props.listsArray.map((listObj, idx) => (
            <ListsSidebarItemWithMenu key={idx} {...listObj} />
        ))

        if (this.props.isAddInputShown) {
            return [
                <ListsSidebarEditableItem
                    key="add-list"
                    onCancelClick={this.props.cancelAddNewList!}
                    onConfirmClick={this.props.confirmAddNewList!}
                />,
                ...listItems,
            ]
        }

        return listItems
    }

    render() {
        return (
            <Container>
                {this.props.title && (
                    <GroupHeaderContainer>
                        {this.props.onExpandBtnClick && (
                            <IconContainer
                                onClick={this.props.onExpandBtnClick}
                            >
                                <Margin horizontal="5.5px">
                                    <Icon
                                        plus90={this.props.isExpanded}
                                        minus90={!this.props.isExpanded}
                                        heightAndWidth="8px"
                                        path={icons.triangle}
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <GroupHeaderInnerDiv className="inner">
                            <GroupTitle>{this.props.title}</GroupTitle>
                            {this.props.onAddBtnClick && (
                                <IconContainer
                                    onClick={this.props.onAddBtnClick}
                                >
                                    <Margin horizontal="8px">
                                        <Icon
                                            heightAndWidth="12px"
                                            path={icons.plus}
                                        />
                                    </Margin>
                                </IconContainer>
                            )}
                        </GroupHeaderInnerDiv>
                    </GroupHeaderContainer>
                )}
                {this.renderLists()}
            </Container>
        )
    }
}

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
import { Props as ListsSidebarItemProps } from '../lists-sidebar-item-with-menu'
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
    line-height: 18px;
    cursor: pointer;

    width: max-content;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 300;
    padding: 5px 0px 5px 5px;
    opacity: 0.7;
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
    listsArray?: ListsSidebarItemProps[]
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

    private renderGroupContent() {
        if (!this.props.isExpanded) {
            return null
        }

        if (this.props.loadingState === 'running') {
            return this.renderLoadingState()
        }

        if (this.props.loadingState === 'error') {
            return this.renderErrorState()
        }

        if (this.props.isAddInputShown) {
            return (
                <ListsSidebarEditableItem
                    onCancelClick={this.props.cancelAddNewList!}
                    onConfirmClick={this.props.confirmAddNewList!}
                />
            )
        }

        return this.props.children
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
                                <Margin left="5px">
                                    <Icon
                                        rotation={
                                            this.props.isExpanded ? '0' : '-90'
                                        }
                                        heightAndWidth="12px"
                                        path={icons.triangle}
                                    />
                                </Margin>
                            </IconContainer>
                        )}
                        <GroupHeaderInnerDiv className="inner">
                            <GroupTitle onClick={this.props.onExpandBtnClick}>
                                {this.props.title}
                            </GroupTitle>
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
                {this.renderGroupContent()}
            </Container>
        )
    }
}

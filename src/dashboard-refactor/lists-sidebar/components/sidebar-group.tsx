import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import styles from 'src/dashboard-refactor/styles'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import styled from 'styled-components'
import { ThemeProvider } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import { TaskState } from 'ui-logic-core/lib/types'
import { Props as ListsSidebarItemProps } from './sidebar-item-with-menu'
import * as icons from 'src/common-ui/components/design-library/icons'

const { fonts } = styles

const Container = styled.div`
    width: 100%;
    position: relative;
`

const LoadingContainer = styled.div`
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    padding-right: 5px;
`

const GroupTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerBlue};
    font-family: ${fonts.primary.name};
    line-height: 18px;
    cursor: pointer;

    width: fill-available;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 600;
    padding: 5px 0px 5px 20px;
`

const IconContainer = styled.div`
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;

    &:hover {
        background: #f0f0f0;
    }
`

const IconGroup = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
`

const ErrorMsg = styled.div`
    padding: 0 10px;
`

export interface ListsSidebarGroupProps {
    title?: string
    isExpanded: boolean
    isAddInputShown?: boolean
    loadingState: TaskState
    confirmAddNewList?: (name: string) => void
    cancelAddNewList?: (shouldSave: boolean) => void
    onAddBtnClick?: React.MouseEventHandler
    onExpandBtnClick?: React.MouseEventHandler
    listsArray?: ListsSidebarItemProps[]
}

export default class ListsSidebarGroup extends PureComponent<
    ListsSidebarGroupProps
> {
    private renderErrorState = function () {
        return (
            <ErrorMsg>Collections could not be loaded at this time...</ErrorMsg>
        )
    }

    private renderLoadingState = function () {
        return (
            <Margin vertical="15px">
                <LoadingContainer>
                    <LoadingIndicator size={20} />
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

        return this.props.children
    }

    render() {
        return (
            <Container>
                {this.props.title && (
                    <GroupHeaderContainer>
                        <GroupHeaderInnerDiv className="inner">
                            <GroupTitle onClick={this.props.onExpandBtnClick}>
                                {this.props.title}
                            </GroupTitle>
                            <IconGroup>
                                {this.props.onAddBtnClick && (
                                    <Icon
                                        heightAndWidth="14px"
                                        filePath={icons.plus}
                                        color={'purple'}
                                        onClick={this.props.onAddBtnClick}
                                    />
                                )}
                                {this.props.onExpandBtnClick && (
                                    <Icon
                                        rotation={
                                            this.props.isExpanded ? 0 : -90
                                        }
                                        heightAndWidth="16px"
                                        filePath={icons.triangle}
                                        color={'iconColor'}
                                        onClick={this.props.onExpandBtnClick}
                                    />
                                )}
                            </IconGroup>
                        </GroupHeaderInnerDiv>
                    </GroupHeaderContainer>
                )}
                {this.renderGroupContent()}
            </Container>
        )
    }
}

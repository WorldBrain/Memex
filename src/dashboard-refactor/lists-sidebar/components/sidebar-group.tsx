import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import Margin from 'src/dashboard-refactor/components/Margin'
import { fonts } from 'src/dashboard-refactor/styles'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { TaskState } from 'ui-logic-core/lib/types'

export interface Props {
    title: string
    listsCount: number
    isExpanded: boolean
    loadingState: TaskState
    onAddBtnClick?: React.MouseEventHandler
    onExpandBtnClick: React.MouseEventHandler
    spaceSidebarWidth: string
}

export default class ListsSidebarGroup extends PureComponent<Props> {
    private renderGroupContent() {
        if (!this.props.isExpanded) {
            return null
        }

        if (this.props.loadingState === 'running') {
            return (
                <Margin vertical="15px">
                    <LoadingContainer>
                        <LoadingIndicator size={20} />
                    </LoadingContainer>
                </Margin>
            )
        }

        if (this.props.loadingState === 'error') {
            return (
                <ErrorMsg>
                    Collections could not be loaded at this time...
                </ErrorMsg>
            )
        }

        return this.props.children
    }

    render() {
        return (
            <Container spaceSidebarWidth={this.props.spaceSidebarWidth}>
                <GroupHeaderContainer
                    spaceSidebarWidth={this.props.spaceSidebarWidth}
                    onClick={this.props.onExpandBtnClick}
                >
                    <GroupHeaderInnerDiv className="inner">
                        {/* {this.props.onExpandBtnClick && (
                                <ArrowIcon
                                    rotation={this.props.isExpanded ? 0 : -90}
                                    heightAndWidth="16px"
                                    filePath={icons.triangle}
                                    color={'greyScale4'}
                                    onClick={this.props.onExpandBtnClick}
                                    hoverOff
                                />
                            )} */}
                        <GroupTitle>
                            {this.props.title}
                            <IconGroup>
                                {this.props.onAddBtnClick && (
                                    <Icon
                                        icon="plus"
                                        heightAndWidth="16px"
                                        color={'prime1'}
                                        padding={'4px'}
                                        onClick={this.props.onAddBtnClick}
                                    />
                                )}
                                {this.props.loadingState === 'success' && (
                                    <Counter>{this.props.listsCount}</Counter>
                                )}
                            </IconGroup>
                        </GroupTitle>
                    </GroupHeaderInnerDiv>
                </GroupHeaderContainer>
                <GroupScrollContainer
                    spaceSidebarWidth={this.props.spaceSidebarWidth}
                >
                    <GroupContentSection {...this.props}>
                        {this.renderGroupContent()}
                    </GroupContentSection>
                </GroupScrollContainer>
            </Container>
        )
    }
}

const Container = styled.div<{
    spaceSidebarWidth: string
}>`
    max-width: ${(props) => props.spaceSidebarWidth};
    position: relative;
    user-select: none;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const ArrowIcon = styled(Icon)``

const LoadingContainer = styled.div`
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
`

const GroupHeaderContainer = styled.div<{
    spaceSidebarWidth: string
}>`
    height: 40px;
    width: ${(props) => props.spaceSidebarWidth};
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: flex-end;
    cursor: pointer;

    &:hover ${ArrowIcon} {
        background-color: ${(props) => props.theme.colors.greyScale3};
    }
`

const GroupHeaderInnerDiv = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 7px 0 25px;

    & * {
        cursor: pointer;
    }
`

const GroupTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-family: ${fonts.primary.name};
    line-height: 18px;
    cursor: pointer;
    width: fill-available;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    font-weight: 400;
    padding: 5px 10px 5px 0px;
    justify-content: space-between;
    width: fill-available;
    display: flex;
    align-items: center;
    user-select: none;
`

const Counter = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
`

const IconGroup = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-end;

    &:hover ${ArrowIcon} {
        background-color: unset;
    }
`

const ErrorMsg = styled.div`
    padding: 0 10px;
`

const GroupScrollContainer = styled.div<{
    spaceSidebarWidth: string
}>`
    overflow: scroll;
    width: calc(${(props) => props.spaceSidebarWidth});
    height: fit-content;
    padding: 5px 0px;
    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const GroupContentSection = styled.div<Props>`
    min-width: fit-content;
    width: fill-available;
    width: -moz-available;
    width: 100%;

    ${(props) =>
        props.isExpanded &&
        props.listsCount > 0 &&
        css`
            margin-bottom: 10px;
        `}
`

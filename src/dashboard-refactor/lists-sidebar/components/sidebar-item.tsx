import React from 'react'
import { fonts } from 'src/dashboard-refactor/styles'
import styled, { css } from 'styled-components'
import type { DropReceivingState } from 'src/dashboard-refactor/types'

export interface Props {
    name: string
    isSelected: boolean
    isPrivate?: boolean
    isShared?: boolean
    indentSteps?: number
    alwaysShowRightSideIcon?: boolean
    hasChildren?: boolean
    dropReceivingState?: DropReceivingState
    onDragStart?: React.DragEventHandler
    onDragEnd?: React.DragEventHandler
    onClick?: React.MouseEventHandler
    renderLeftSideIcon?: () => JSX.Element
    renderRightSideIcon?: () => JSX.Element
    renderEditIcon?: () => JSX.Element
    areAnyMenusDisplayed?: boolean
    forceRightSidePermanentDisplay?: boolean
    spaceSidebarWidth: string
    sidebarItemRef?: (el: any) => void
    isMenuDisplayed?: boolean
}

export interface State {
    isHovering: boolean
    canDisableHover: boolean
}

export default class ListsSidebarItem extends React.PureComponent<
    Props,
    State
> {
    state: State = { isHovering: false, canDisableHover: false }

    private handleDrop: React.DragEventHandler = (e) => {
        e.preventDefault()
        if (!this.props.dropReceivingState?.canReceiveDroppedItems) {
            return
        }
        this.props.dropReceivingState?.onDrop(e.dataTransfer)
    }

    render() {
        if (!this.props.areAnyMenusDisplayed && this.state.canDisableHover) {
            this.setState({ isHovering: false, canDisableHover: false })
        }

        return (
            <Container
                onMouseEnter={() => this.setState({ isHovering: true })}
                isHovering={this.state.isHovering}
                onMouseLeave={() => {
                    if (!this.props.areAnyMenusDisplayed) {
                        this.setState({
                            isHovering: false,
                            canDisableHover: true,
                        })
                    }
                    this.setState({
                        canDisableHover: true,
                    })
                }}
                spaceSidebarWidth={this.props.spaceSidebarWidth}
                onDragEnter={this.props.dropReceivingState?.onDragEnter}
                onDragLeave={this.props.dropReceivingState?.onDragLeave}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onDrop={this.handleDrop}
                onClick={this.props.onClick}
            >
                <SidebarItem
                    ref={this.props.sidebarItemRef}
                    spaceSidebarWidth={this.props.spaceSidebarWidth}
                    indentSteps={this.props.indentSteps ?? 0}
                    isSelected={this.props.isSelected}
                    dropReceivingState={this.props.dropReceivingState}
                    name={this.props.name} // Add this line
                >
                    <LeftSideIconContainer
                        alwaysShowRightSideIcon={
                            this.props.alwaysShowRightSideIcon
                        }
                    >
                        {(this.state.isHovering ||
                            this.props.hasChildren ||
                            this.props.alwaysShowRightSideIcon) &&
                            this.props.renderLeftSideIcon?.()}
                    </LeftSideIconContainer>
                    <SidebarItemClickContainer
                        spaceSidebarWidth={this.props.spaceSidebarWidth}
                    >
                        <TitleBox
                            onDragStart={this.props.onDragStart}
                            onDragEnd={this.props.onDragEnd}
                            draggable
                        >
                            <ListTitle>
                                <Name>{this.props.name}</Name>
                            </ListTitle>
                        </TitleBox>
                    </SidebarItemClickContainer>
                    {(this.props.isShared ||
                        this.state.isHovering ||
                        this.props.forceRightSidePermanentDisplay) && (
                        <RightSideActionBar
                            alwaysShowRightSideIcon={
                                this.props.alwaysShowRightSideIcon
                            }
                        >
                            <IconBox {...this.props} {...this.state}>
                                {this.props.renderEditIcon?.()}
                            </IconBox>
                            {(this.props.isShared ||
                                this.state.isHovering ||
                                this.props.forceRightSidePermanentDisplay) &&
                                this.props.renderRightSideIcon?.()}
                        </RightSideActionBar>
                    )}
                </SidebarItem>
            </Container>
        )
    }
}

const LeftSideIconContainer = styled.div<{ alwaysShowRightSideIcon: boolean }>`
    display: flex;
    z-index: 11;
    margin-left: 5px;
    width: 20px;

    ${(props) =>
        props.alwaysShowRightSideIcon &&
        css`
            padding-right: 15px;
        `}
`

const RightSideActionBar = styled.div<{ alwaysShowRightSideIcon: boolean }>`
    position: absolute;
    padding-right: 10px;
    right: 5px;
    display: flex;
    z-index: 10;
    backdrop-filter: blur(5px);
    height: -webkit-fill-available;
    height: -moz-available;
    align-items: center;
    justify-content: flex-end;

    ${(props) =>
        props.alwaysShowRightSideIcon &&
        css`
            backdrop-filter: none;
        `}
`

const SidebarItemClickContainer = styled.div<{ spaceSidebarWidth: string }>`
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    justify-content: flex-start;
    padding-left: 5px;
    padding-right: 10px;
    grid-gap: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    z-index: 10;
`

const Container = styled.div<{
    isHovering: boolean
    spaceSidebarWidth: string
}>`
    position: relative;
    z-index: ${(props) => (props.isHovering ? 2147483647 : 0)};
    width: fit-content;
    /* max-width: calc(${(props) => props.spaceSidebarWidth} - 34px); */
    width: calc(${(props) => props.spaceSidebarWidth} - 0px);
    padding: 0 7px 0 0px;
`

const Name = styled.div`
    display: block;
    overflow-x: hidden;
    text-overflow: ellipsis;
    color: ${(props) => props.theme.colors.greyScale6};
`

const TitleBox = styled.div<{
    draggable: boolean
}>`
    display: flex;
    flex: 0 1 100%;
    width: 30%;
    height: 100%;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale5};
`

const SidebarItem = styled.div<Props>`
    height: 40px;
    /* margin: 0px 12px; */
    position: relative;
    scroll-margin: 20px;
    padding-left: ${({ indentSteps }: Props) => indentSteps * 15}px;
    display: flex;
    width: fill-available;
    width: -moz-available;
    min-width: 10%;
    flex-direction: row;
    padding-right: 5px;
    /* width: calc(${(props) => props.spaceSidebarWidth} - 0px); */
    justify-content: space-between;
    align-items: center;
    background-color: ${(props) =>
        props.dropReceivingState?.isDraggedOver
            ? props.theme.colors.greyScale1
            : 'transparent'};


    &:hover ${TitleBox} {
        width: 30%;
    }

    ${({ isSelected }: Props) =>
        isSelected &&
        css`
            color: ${(props) => props.theme.colors.darkText};
            background: ${(props) => props.theme.colors.greyScale2};
        `}


    cursor: ${({ dropReceivingState }: Props) =>
        !dropReceivingState?.isDraggedOver
            ? `pointer`
            : dropReceivingState?.canReceiveDroppedItems
            ? `pointer`
            : `not-allowed`};

    &:hover {
        background: ${(props) => props.theme.colors.greyScale1_5};

        ${({ isSelected }: Props) =>
            isSelected &&
            css`
                background: ${(props) => props.theme.colors.greyScale2};
            `}
        ${(props) =>
            props.theme.variant === 'light' &&
            css`
                background: ${(props) => props.theme.colors.greyScale3};
            `};
    }

    ${(props) =>
        props.dropReceivingState?.isDraggedOver &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        `}`

const ListTitle = styled.span`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: 400;
    font-style: normal;
    font-size: 14px;
    line-height: 22px;
    height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 20px;
    justify-content: flex-start;
    width: 100%;
    pointer-events: none;
`

const IconBox = styled.div<Props & State>`
    display: none;
    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 5px;
    padding-left: 5px;
    z-index: 1;

    // List all states in which to display
    ${(props) =>
        (props.alwaysShowRightSideIcon ||
            props.isHovering ||
            props.dropReceivingState?.isDraggedOver ||
            props.dropReceivingState?.wasPageDropped ||
            props.isMenuDisplayed) &&
        css`
            display: flex;
            grid-gap: 10px;
        `}
`

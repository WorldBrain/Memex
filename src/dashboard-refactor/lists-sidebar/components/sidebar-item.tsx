import React from 'react'
import { fonts } from 'src/dashboard-refactor/styles'
import styled, { css } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { DropReceivingState } from 'src/dashboard-refactor/types'

export interface Props {
    name: string
    isSelected: boolean
    isPrivate?: boolean
    isShared?: boolean
    alwaysShowRightSideIcon?: boolean
    dropReceivingState?: DropReceivingState
    onClick: React.MouseEventHandler
    renderLeftSideIcon?: () => JSX.Element
    renderRightSideIcon?: () => JSX.Element
    renderEditIcon?: () => JSX.Element
    areAnyMenusDisplayed?: boolean
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

    private handleDragEnter: React.DragEventHandler = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // Needed to push this op back on the event queue, so it fires after the previous
        //  list item's `onDropLeave` event
        setTimeout(() => this.props.dropReceivingState?.onDragEnter(), 0)
    }

    private handleDrop: React.DragEventHandler = (e) => {
        e.preventDefault()
        if (!this.props.dropReceivingState?.canReceiveDroppedItems) {
            return
        }
        this.props.dropReceivingState?.onDrop(e.dataTransfer)
    }

    render() {
        if (this.props.areAnyMenusDisplayed && this.state.canDisableHover) {
            this.setState({ isHovering: true, canDisableHover: false })
        }

        return (
            <Container>
                <SidebarItem
                    onClick={this.props.onClick}
                    onDragEnter={this.handleDragEnter}
                    isSelected={this.props.isSelected}
                    dropReceivingState={this.props.dropReceivingState}
                    onDragLeave={this.props.dropReceivingState?.onDragLeave}
                    onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }} // Needed to allow the `onDrop` event to fire
                    onDrop={this.handleDrop}
                    onMouseEnter={() => this.setState({ isHovering: true })}
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
                >
                    {this.props.renderLeftSideIcon?.()}
                    <TitleBox>
                        <ListTitle>
                            <Name>{this.props.name}</Name>
                            {this.props.isShared && (
                                <TooltipBox
                                    tooltipText="Shared Space"
                                    placement="bottom"
                                >
                                    <Icon
                                        heightAndWidth="18px"
                                        icon="peopleFine"
                                        hoverOff
                                    />
                                </TooltipBox>
                            )}
                        </ListTitle>
                    </TitleBox>
                    <IconBox {...this.props} {...this.state}>
                        {this.props.renderEditIcon?.()}
                        {this.props.renderRightSideIcon?.()}
                    </IconBox>
                </SidebarItem>
            </Container>
        )
    }
}

const Container = styled.div`
    position: relative;
`

const Name = styled.div`
    display: block;
    overflow-x: hidden;
    text-overflow: ellipsis;
    color: ${(props) => props.theme.colors.greyScale6};
`

const TitleBox = styled.div<Props>`
    display: flex;
    flex: 0 1 100%;
    width: 91%;
    height: 100%;
    padding-left: 14px;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale5};
`

const SidebarItem = styled.div<Props>`
    height: 40px;
    margin: 5px 12px;
    border-radius: 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: ${(props) =>
        props.dropReceivingState?.isDraggedOver
            ? props.theme.colors.greyScale1
            : 'transparent'};


    &:hover ${TitleBox} {
        width: 70%;
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
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};

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
    padding-right: 10px;
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

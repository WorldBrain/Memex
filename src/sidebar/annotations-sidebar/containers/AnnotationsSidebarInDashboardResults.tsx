import * as React from 'react'
import styled from 'styled-components'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { ButtonTooltip } from 'src/common-ui/components'

export class AnnotationsSidebarInDashboardResults extends AnnotationsSidebarContainer {
    private handleAddCommentBtnClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        if (this.state.showCommentBox) {
            this.processEvent('cancelNewPageComment', null)
        } else {
            this.processEvent('addNewPageComment', null)
        }
    }

    private handleCloseSidebarBtnClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        this.hideSidebar()
    }

    private renderTopBar() {
        return (
            <TopBarContainerStyled>
                <ButtonTooltip
                    tooltipText="Close (ESC)"
                    position="rightCentered"
                >
                    <CloseBtn
                        onClick={this.handleCloseSidebarBtnClick}
                        title="Close sidebar once. Disable via Memex icon in the extension toolbar."
                    >
                        <CloseIcon />
                    </CloseBtn>
                </ButtonTooltip>
                <ButtonTooltip
                    tooltipText="Add notes to page"
                    position="leftNarrow"
                >
                    <CommentBtn onClick={this.handleAddCommentBtnClick} />
                </ButtonTooltip>
            </TopBarContainerStyled>
        )
    }

    render() {
        if (this.state.showState === 'hidden') {
            return null
        }

        return (
            <ContainerStyled>
                {this.renderTopBar()}
                {super.render()}
            </ContainerStyled>
        )
    }
}

const ContainerStyled = styled.div`
    height: 100%;
    width: 450px;
    position: fixed;
    right: 0;
    top: 55px;
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
`

const TopBarContainerStyled = styled.div`
    position: sticky;
    top: 0;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 8px 5px 3px;
    height: 40px;
    box-sizing: border-box;
    margin-top: 3px;
`

// TODO: inheirits from .nakedSquareButton
const CommentBtn = styled.button`
    background-color: #e8e8e8;
    color: rgb(54, 54, 46);
    border-radius: 3px;
    padding: 2px;
    background-image: url('/img/comment_add.svg');

    width: 25px;
    height: 25px;
    border-radius: 3px;
    opacity: 0.8;
    margin-left: 4px;
    background-size: 18px 18px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }
`

const CloseBtn = styled.button`
    cursor: pointer;
    z-index: 2147483647;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
`

// TODO: inherits from .closeIcon
const CloseIcon = styled.span`
    mask-position: center;
    mask-repeat: no-repeat;
    display: flex;
    height: 20px;
    width: 20px;
    mask-size: 16px;
    background-color: #3a2f45;
    mask-image: url('/img/close.svg');
`

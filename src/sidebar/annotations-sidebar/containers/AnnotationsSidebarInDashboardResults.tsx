import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { ButtonTooltip } from 'src/common-ui/components'

export class AnnotationsSidebarInDashboardResults extends AnnotationsSidebarContainer {
    private handleCloseSidebarBtnClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        this.hideSidebar()
    }

    protected renderTopBarLeft() {
        return (
            <ButtonTooltip tooltipText="Close (ESC)" position="rightCentered">
                <CloseBtn
                    onClick={this.handleCloseSidebarBtnClick}
                    title="Close sidebar once. Disable via Memex icon in the extension toolbar."
                >
                    <CloseIcon />
                </CloseBtn>
            </ButtonTooltip>
        )
    }
}

export default onClickOutside(AnnotationsSidebarInDashboardResults)

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

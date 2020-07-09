import * as React from 'react'
import styled from 'styled-components'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { ButtonTooltip } from 'src/common-ui/components'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'

type Props = SidebarContainerOptions & {
    onCloseSidebarBtnClick: React.MouseEventHandler
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
}

export class AnnotationsSidebarInDashboardResults extends React.Component<
    Props
> {
    static defaultProps: Partial<Props> = {
        theme: { topOffsetPx: 55 },
        showGoToAnnotationBtn: true,
    }

    render() {
        const { refSidebar, ...props } = this.props
        return (
            <AnnotationsSidebarContainer
                elements={{ topBarLeft: this.renderTopBarLeft() }}
                ref={refSidebar}
                {...props}
            />
        )
    }

    private renderTopBarLeft() {
        return (
            <ButtonTooltip tooltipText="Close (ESC)" position="rightCentered">
                <CloseBtn
                    onClick={this.props.onCloseSidebarBtnClick}
                    title="Close sidebar"
                >
                    <CloseIcon />
                </CloseBtn>
            </ButtonTooltip>
        )
    }
}

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

import * as React from 'react'
import styled from 'styled-components'

import { AnnotationsSidebarContainer } from './AnnotationsSidebarContainer'
import { ButtonTooltip } from 'src/common-ui/components'
import { SidebarContainerOptions } from 'src/sidebar/annotations-sidebar/containers/logic'

type Props = SidebarContainerOptions & {
    refSidebar?: React.Ref<AnnotationsSidebarContainer>
    onCloseSidebarBtnClick: React.MouseEventHandler
}
export class AnnotationsSidebarInContentReader extends React.Component<Props> {
    render() {
        const { refSidebar, ...props } = this.props
        return (
            <AnnotationsSidebarContainer
                elements={{ topBarLeft: this.renderTopBarLeft() }}
                ref={refSidebar}
                theme={{ topOffsetPx: 55 }}
                showGoToAnnotationBtn={true}
                {...props}
            />
        )
    }

    protected renderTopBarLeft() {
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
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    border-radius: 3px;

    &:hover {
        background-color: #e0e0e0;
    }
`

// TODO: inherits from .closeIcon
const CloseIcon = styled.span`
    mask-position: center;
    mask-repeat: no-repeat;
    display: flex;
    height: 100%;
    width: 100%;
    mask-size: 100%;
    background-color: #3a2f45;
    mask-image: url('/img/close.svg');
`

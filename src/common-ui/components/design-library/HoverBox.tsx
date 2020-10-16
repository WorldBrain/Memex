import React from 'react'
import styled from 'styled-components'

export interface Props {
    top?: string
    left?: string
    right?: string
    bottom?: string
    withRelativeContainer?: boolean
}

export class HoverBox extends React.Component<Props> {
    render() {
        if (!this.props.withRelativeContainer) {
            return <HoverBoxDiv>{this.props.children}</HoverBoxDiv>
        }

        return (
            <HoverBoxContainer {...this.props}>
                <HoverBoxDiv>{this.props.children}</HoverBoxDiv>
            </HoverBoxContainer>
        )
    }
}

export const HoverBoxContainer = styled.div`
    position: relative;
    ${(props) => (props.top ? `top: ${props.top}` : '')}
    ${(props) => (props.left ? `left: ${props.left}` : '')}
    ${(props) => (props.right ? `right: ${props.right}` : '')}
    ${(props) => (props.bottom ? `bottom: ${props.bottom}` : '')}
`

export const HoverBoxDiv = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: visible;
    position: absolute;
    border-radius: 3px;
    width: 300px;
    background-color: #fff;
    border-radius: 3px;
    z-index: 3;
`

export const HoverBoxDashboard = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: visible;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    border-radius: 3px;
    right: 20px;
    top: 40px;
`

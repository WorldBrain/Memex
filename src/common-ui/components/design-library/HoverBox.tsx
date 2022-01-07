import React from 'react'
import styled from 'styled-components'

export interface Props {
    top?: string
    left?: string
    right?: string
    bottom?: string
    width?: string
    withRelativeContainer?: boolean
    position?: string
    height?: string
    overflow?: string
}

export class HoverBox extends React.Component<Props> {
    render() {
        if (!this.props.withRelativeContainer) {
            return (
                <HoverBoxDiv {...this.props}>{this.props.children}</HoverBoxDiv>
            )
        }

        return (
            <HoverBoxContainer>
                <HoverBoxDiv {...this.props}>{this.props.children}</HoverBoxDiv>
            </HoverBoxContainer>
        )
    }
}

export const HoverBoxContainer = styled.div<Props>`
    position: relative;
    overflow: ${(props) => (props.overflow ? props.overflow : 'visible')};
`

export const HoverBoxDiv = styled.div<Props>`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: ${(props) => (props.overflow ? props.overflow : 'visible')};;
    position: ${(props) => (props.position ? props.position : 'absolute')};;
    border-radius: 3px;
    width: ${(props) => (props.width ? props.width : '300px')};
    height: ${(props) => (props.height ? props.height : 'fit-content')};
    ${(props) => (props.top ? `top: ${props.top};` : '')}
    ${(props) => (props.left ? `left: ${props.left};` : '')}
    ${(props) => (props.right ? `right: ${props.right};` : '')}
    ${(props) => (props.bottom ? `bottom: ${props.bottom};` : '')}
    background-color: #fff;
    border-radius: 3px;
    z-index: 1001;

    &::-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none;
`

export const HoverBoxDashboard = styled.div`
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
    overflow: scroll;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    border-radius: 3px;
    right: 20px;
    top: 40px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

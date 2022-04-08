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
    padding?: string
    onMouseLeave?: () => void
}

export class HoverBox extends React.Component<Props> {
    render() {
        if (!this.props.withRelativeContainer) {
            return (
                <HoverBoxDiv {...this.props}>{this.props.children}</HoverBoxDiv>
            )
        }

        return (
            <HoverBoxContainer
                onMouseLeave={this.props.onMouseLeave}
                {...this.props}
            >
                <HoverBoxDiv {...this.props}>{this.props.children}</HoverBoxDiv>
            </HoverBoxContainer>
        )
    }
}

export const HoverBoxContainer = styled.div<Props>`
    position: ${(props) => (props.position ? props.position : 'relative')};
    overflow: ${(props) => (props.overflow ? props.overflow : 'visible')};
`

export const HoverBoxDiv = styled.div<Props>`
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 12px;
    overflow: ${(props) => (props.overflow ? props.overflow : 'visible')};;
    position: ${(props) => (props.position ? props.position : 'absolute')};;
    width: ${(props) => (props.width ? props.width : '300px')};
    height: ${(props) => (props.height ? props.height : 'fit-content')};
    ${(props) => (props.top ? `top: ${props.top};` : '')}
    ${(props) => (props.left ? `left: ${props.left};` : '')}
    ${(props) => (props.right ? `right: ${props.right};` : '')}
    ${(props) => (props.bottom ? `bottom: ${props.bottom};` : '')}
    background-color: #fff;
    z-index: 1001;
    padding: ${(props) => (props.padding ? props.padding : '10px 0px')};

    &::-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none;
`

export const HoverBoxDashboard = styled.div`
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    overflow: scroll;
    position: absolute;
    width: 300px;
    z-index: 1;
    background-color: #fff;
    border-radius: 12px;
    right: 20px;
    padding: 10px 0px;
    top: 40px;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
